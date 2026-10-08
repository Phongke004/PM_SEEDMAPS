import { supabase, type Hall, type HallElement } from '../supabase';
import { apiHalls, apiElements } from '../api';
import { USE_CSHARP_API } from '../config';

export const hallService = {
  // --- HALLS ---
  async getHalls() {
    if (USE_CSHARP_API) {
      try {
        const data = await apiHalls.getAll();
        return data.map((h) => ({
          ...h,
          id: h.id ?? (h as any).Id,
          name: h.name ?? (h as any).Name,
          description: h.description ?? (h as any).Description,
          row_count: h.row_count ?? (h as any).rowCount ?? (h as any).RowCount ?? 10,
          col_count: h.col_count ?? (h as any).colCount ?? (h as any).ColCount ?? 10,
          created_at: h.created_at ?? (h as any).createdAt ?? (h as any).CreatedAt,
          updated_at: h.updated_at ?? (h as any).updatedAt ?? (h as any).UpdatedAt,
        }));
      } catch (err) {
        console.warn('C# API error, falling back to Supabase', err);
      }
    }
    const { data, error } = await supabase.from('halls').select('*').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Hall[];
  },

  async createHall(payload: { name: string; description: string; row_count: number; col_count: number }) {
    if (USE_CSHARP_API) {
      return await apiHalls.create({
        Name: payload.name,
        Description: payload.description,
        RowCount: payload.row_count,
        ColCount: payload.col_count,
      } as any);
    }
    const { data, error } = await supabase.from('halls').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as Hall;
  },

  async updateHall(id: string, payload: { name: string; description: string; row_count: number; col_count: number }) {
    if (USE_CSHARP_API) {
      return await apiHalls.update(id, {
        Name: payload.name,
        Description: payload.description,
        RowCount: payload.row_count,
        ColCount: payload.col_count,
      } as any);
    }
    const { error } = await supabase.from('halls').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async deleteHall(id: string) {
    if (USE_CSHARP_API) {
      return await apiHalls.delete(id);
    }
    const { error } = await supabase.from('halls').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // --- HALL ELEMENTS ---
  async getHallElements(hallId: string) {
    if (USE_CSHARP_API) {
      try {
        const data = await apiElements.getByHall(hallId);
        return data.map((e) => ({
          id: e.id ?? (e as any).Id,
          hall_id: e.hall_id ?? (e as any).hallId ?? (e as any).HallId,
          element_type: e.element_type ?? (e as any).elementType ?? (e as any).ElementType,
          x: e.x ?? (e as any).X,
          y: e.y ?? (e as any).Y,
          width: e.width ?? (e as any).Width,
          height: e.height ?? (e as any).Height,
          rotation: e.rotation ?? (e as any).Rotation,
          label: e.label ?? (e as any).Label,
          seat_type: e.seat_type ?? (e as any).seatType ?? (e as any).SeatType,
          created_at: e.created_at ?? (e as any).createdAt ?? (e as any).CreatedAt,
        }));
      } catch (err) {
        console.warn('C# API error, falling back to Supabase', err);
      }
    }
    const { data, error } = await supabase.from('hall_elements').select('*').eq('hall_id', hallId);
    if (error) throw new Error(error.message);
    return data as HallElement[];
  },

  async saveBatchElements(hallId: string, elements: Partial<HallElement>[]) {
    if (USE_CSHARP_API) {
      const formatted = elements.map((e) => ({
        Id: e.id,
        HallId: hallId,
        ElementType: e.element_type,
        X: e.x,
        Y: e.y,
        Width: e.width,
        Height: e.height,
        Rotation: e.rotation,
        Label: e.label,
        SeatType: e.seat_type,
      }));
      return await apiElements.saveBatch(hallId, formatted as any);
    }
    // Delete old elements and insert new
    await supabase.from('hall_elements').delete().eq('hall_id', hallId);
    if (elements.length > 0) {
      const { error } = await supabase.from('hall_elements').insert(elements.map((e) => ({ ...e, hall_id: hallId })));
      if (error) throw new Error(error.message);
    }
  },
};

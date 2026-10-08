import { supabase, type AppEvent } from '../supabase';
import { apiEvents } from '../api';
import { USE_CSHARP_API } from '../config';

export const eventService = {
  // --- EVENTS ---
  async getEvents() {
    if (USE_CSHARP_API) {
      try {
        const data = await apiEvents.getAll();
        return data.map((e) => ({
          ...e,
          id: e.id ?? (e as any).Id,
          name: e.name ?? (e as any).Name,
          description: e.description ?? (e as any).Description,
          status: e.status ?? (e as any).Status,
          hall_id: e.hall_id ?? (e as any).hallId ?? (e as any).HallId,
          event_date: e.event_date ?? (e as any).eventDate ?? (e as any).EventDate,
          created_at: e.created_at ?? (e as any).createdAt ?? (e as any).CreatedAt,
          updated_at: e.updated_at ?? (e as any).updatedAt ?? (e as any).UpdatedAt,
          hall_name: e.hall_name ?? (e as any).hallName ?? (e as any).HallName,
        }));
      } catch (err) {
        console.warn('C# API error, falling back to Supabase', err);
      }
    }
    const { data, error } = await supabase.from('events').select('*, halls(name)').order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []).map((e: any) => ({
      ...e,
      hall_name: e.halls?.name ?? '',
    })) as AppEvent[];
  },

  async createEvent(payload: { name: string; description: string; hall_id: string; event_date: string; status: string }) {
    if (USE_CSHARP_API) {
      return await apiEvents.create({
        Name: payload.name,
        Description: payload.description,
        HallId: payload.hall_id,
        EventDate: payload.event_date,
        Status: payload.status,
      } as any);
    }
    const { data, error } = await supabase.from('events').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as AppEvent;
  },

  async updateEvent(id: string, payload: { name: string; description: string; hall_id: string; event_date: string; status: string }) {
    if (USE_CSHARP_API) {
      return await apiEvents.update(id, {
        Name: payload.name,
        Description: payload.description,
        HallId: payload.hall_id,
        EventDate: payload.event_date,
        Status: payload.status,
      } as any);
    }
    const { error } = await supabase.from('events').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async deleteEvent(id: string) {
    if (USE_CSHARP_API) {
      return await apiEvents.delete(id);
    }
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },
};

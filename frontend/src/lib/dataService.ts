import { supabase, type Hall, type HallElement, type AppEvent, type Attendee, type Assignment } from './supabase';
import { apiHalls, apiElements, apiEvents, apiAttendees, apiAssignments } from './api';

// Check if C# API server is active
export const USE_CSHARP_API = true;

export const dataService = {
  // --- HALLS ---
  async getHalls() {
    if (USE_CSHARP_API) {
      try {
        const data = await apiHalls.getAll();
        return data.map((h) => ({
          ...h,
          row_count: h.row_count ?? (h as any).rowCount ?? 10,
          col_count: h.col_count ?? (h as any).colCount ?? 10,
          created_at: h.created_at ?? (h as any).createdAt,
          updated_at: h.updated_at ?? (h as any).updatedAt,
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
          ...e,
          hall_id: e.hall_id ?? (e as any).hallId,
          element_type: e.element_type ?? (e as any).elementType,
          seat_type: e.seat_type ?? (e as any).seatType,
          created_at: e.created_at ?? (e as any).createdAt,
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

  // --- EVENTS ---
  async getEvents() {
    if (USE_CSHARP_API) {
      try {
        const data = await apiEvents.getAll();
        return data.map((e) => ({
          ...e,
          hall_id: e.hall_id ?? (e as any).hallId,
          event_date: e.event_date ?? (e as any).eventDate,
          created_at: e.created_at ?? (e as any).createdAt,
          updated_at: e.updated_at ?? (e as any).updatedAt,
          hall_name: e.hall_name ?? (e as any).hallName,
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

  // --- ATTENDEES ---
  async getAttendees(eventId: string) {
    if (USE_CSHARP_API) {
      try {
        const data = await apiAttendees.getByEvent(eventId);
        return data.map((a) => ({
          ...a,
          event_id: a.event_id ?? (a as any).eventId,
          full_name: a.full_name ?? (a as any).fullName,
          created_at: a.created_at ?? (a as any).createdAt,
        }));
      } catch (err) {
        console.warn('C# API error, falling back to Supabase', err);
      }
    }
    const { data, error } = await supabase.from('attendees').select('*').eq('event_id', eventId).order('full_name');
    if (error) throw new Error(error.message);
    return data as Attendee[];
  },

  async createAttendee(payload: Partial<Attendee>) {
    if (USE_CSHARP_API) {
      return await apiAttendees.create({
        EventId: payload.event_id,
        FullName: payload.full_name,
        Department: payload.department,
        Title: payload.title,
        Position: payload.position,
        Degree: payload.degree,
        Phone: payload.phone,
        Email: payload.email,
        Notes: payload.notes,
        Status: payload.status || 'pending',
      } as any);
    }
    const { data, error } = await supabase.from('attendees').insert(payload).select().single();
    if (error) throw new Error(error.message);
    return data as Attendee;
  },

  async importAttendees(eventId: string, list: Partial<Attendee>[]) {
    if (USE_CSHARP_API) {
      const formatted = list.map((a) => ({
        EventId: eventId,
        FullName: a.full_name,
        Department: a.department,
        Title: a.title,
        Position: a.position,
        Degree: a.degree,
        Phone: a.phone,
        Email: a.email,
        Notes: a.notes,
        Status: 'pending',
      }));
      return await apiAttendees.importBatch(eventId, formatted as any);
    }
    const { error } = await supabase.from('attendees').insert(list.map((a) => ({ ...a, event_id: eventId })));
    if (error) throw new Error(error.message);
  },

  async updateAttendee(id: string, payload: Partial<Attendee>) {
    if (USE_CSHARP_API) {
      return await apiAttendees.update(id, {
        FullName: payload.full_name,
        Department: payload.department,
        Title: payload.title,
        Position: payload.position,
        Degree: payload.degree,
        Phone: payload.phone,
        Email: payload.email,
        Notes: payload.notes,
        Status: payload.status,
      } as any);
    }
    const { error } = await supabase.from('attendees').update(payload).eq('id', id);
    if (error) throw new Error(error.message);
  },

  async deleteAttendee(id: string) {
    if (USE_CSHARP_API) {
      return await apiAttendees.delete(id);
    }
    const { error } = await supabase.from('attendees').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  // --- ASSIGNMENTS ---
  async getAssignments(eventId: string) {
    if (USE_CSHARP_API) {
      try {
        const data = await apiAssignments.getByEvent(eventId);
        return data.map((a: any) => ({
          id: a.id,
          event_id: a.event_id ?? a.eventId,
          element_id: a.element_id ?? a.elementId,
          attendee_id: a.attendee_id ?? a.attendeeId,
          status: a.status,
          created_at: a.created_at ?? a.createdAt,
          element: a.element ? {
            ...a.element,
            hall_id: a.element.hall_id ?? a.element.hallId,
            element_type: a.element.element_type ?? a.element.elementType,
            seat_type: a.element.seat_type ?? a.element.seatType,
          } : undefined,
          attendee: a.attendee ? {
            ...a.attendee,
            event_id: a.attendee.event_id ?? a.attendee.eventId,
            full_name: a.attendee.full_name ?? a.attendee.fullName,
          } : undefined,
        }));
      } catch (err) {
        console.warn('C# API error, falling back to Supabase', err);
      }
    }
    const { data, error } = await supabase.from('assignments').select('*, hall_elements(*), attendees(*)').eq('event_id', eventId);
    if (error) throw new Error(error.message);
    return data as Assignment[];
  },

  async assignSeat(eventId: string, elementId: string, attendeeId: string | null) {
    if (USE_CSHARP_API) {
      return await apiAssignments.assign(eventId, elementId, attendeeId);
    }
    const { data, error } = await supabase
      .from('assignments')
      .upsert({ event_id: eventId, element_id: elementId, attendee_id: attendeeId, status: 'assigned' })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data as Assignment;
  },

  async unassignSeat(id: string) {
    if (USE_CSHARP_API) {
      return await apiAssignments.unassign(id);
    }
    const { error } = await supabase.from('assignments').delete().eq('id', id);
    if (error) throw new Error(error.message);
  },

  async autoAssign(eventId: string, mode: string = 'alphabetical') {
    if (USE_CSHARP_API) {
      return await apiAssignments.autoAssign(eventId, mode);
    }
    // Simple client side auto assign fallback
  },
};

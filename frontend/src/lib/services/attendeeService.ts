import { supabase, type Attendee } from '../supabase';
import { apiAttendees } from '../api';
import { USE_CSHARP_API } from '../config';

export const attendeeService = {
  // --- ATTENDEES ---
  async getAttendees(eventId: string) {
    if (USE_CSHARP_API) {
      try {
        const data = await apiAttendees.getByEvent(eventId);
        return data.map((a) => ({
          ...a,
          id: a.id ?? (a as any).Id,
          event_id: a.event_id ?? (a as any).eventId ?? (a as any).EventId,
          full_name: a.full_name ?? (a as any).fullName ?? (a as any).FullName,
          title: a.title ?? (a as any).Title,
          position: a.position ?? (a as any).Position,
          degree: a.degree ?? (a as any).Degree,
          department: a.department ?? (a as any).Department,
          phone: a.phone ?? (a as any).Phone,
          email: a.email ?? (a as any).Email,
          notes: a.notes ?? (a as any).Notes,
          status: a.status ?? (a as any).Status,
          created_at: a.created_at ?? (a as any).createdAt ?? (a as any).CreatedAt,
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
      return await apiAttendees.create(payload.event_id!, {
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
};

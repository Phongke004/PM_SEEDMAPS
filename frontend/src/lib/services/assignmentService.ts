import { supabase, type Assignment } from '../supabase';
import { apiAssignments } from '../api';
import { USE_CSHARP_API } from '../config';

export const assignmentService = {
  // --- ASSIGNMENTS ---
  async getAssignments(eventId: string) {
    if (USE_CSHARP_API) {
      try {
        const data = await apiAssignments.getByEvent(eventId);
        return data.map((a: any) => ({
          id: a.id ?? a.Id,
          event_id: a.event_id ?? a.eventId ?? a.EventId,
          element_id: a.element_id ?? a.elementId ?? a.ElementId,
          attendee_id: a.attendee_id ?? a.attendeeId ?? a.AttendeeId,
          status: a.status ?? a.Status,
          created_at: a.created_at ?? a.createdAt ?? a.CreatedAt,
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

  async unassignSeat(eventId: string, elementId: string) {
    if (USE_CSHARP_API) {
      return await apiAssignments.unassign(eventId, elementId);
    }
    // Lấy id của assignment để xóa trên Supabase
    const { data } = await supabase.from('assignments').select('id').eq('event_id', eventId).eq('element_id', elementId).single();
    if (data) {
      const { error } = await supabase.from('assignments').delete().eq('id', data.id);
      if (error) throw new Error(error.message);
    }
  },

  async autoAssign(eventId: string, mode: string = 'alphabetical') {
    if (USE_CSHARP_API) {
      return await apiAssignments.autoAssign(eventId, mode);
    }
    // Simple client side auto assign fallback
  },
};

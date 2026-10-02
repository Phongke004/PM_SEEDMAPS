const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Hall {
  id: string;
  name: string;
  description: string;
  row_count: number;
  col_count: number;
  created_at: string;
  updated_at: string;
  element_count?: number;
  chair_count?: number;
  event_count?: number;
}

export interface HallElement {
  id: string;
  hall_id: string;
  element_type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  label: string;
  seat_type: string;
  created_at: string;
}

export interface AppEvent {
  id: string;
  name: string;
  description: string;
  hall_id: string;
  event_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  total_attendees?: number;
  assigned_count?: number;
  hall_name?: string;
}

export interface Attendee {
  id: string;
  event_id: string;
  full_name: string;
  department: string;
  phone: string;
  email: string;
  notes: string;
  status: string;
  title: string;
  position: string;
  degree: string;
  created_at: string;
}

export interface Assignment {
  id: string;
  event_id: string;
  element_id: string;
  attendee_id: string | null;
  status: string;
  created_at: string;
  element?: HallElement;
  attendee?: Attendee;
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'Lỗi khi gọi API');
  }

  return response.json();
}

// Halls API
export const apiHalls = {
  getAll: () => request<Hall[]>('/halls'),
  getById: (id: string) => request<Hall>(`/halls/${id}`),
  create: (data: Partial<Hall>) => request<Hall>('/halls', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Hall>) => request<Hall>(`/halls/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<{ message: string }>(`/halls/${id}`, { method: 'DELETE' }),
};

// Hall Elements API
export const apiElements = {
  getByHall: (hallId: string) => request<HallElement[]>(`/halls/${hallId}/elements`),
  saveBatch: (hallId: string, elements: Partial<HallElement>[]) =>
    request<{ message: string; count: number }>(`/halls/${hallId}/elements/batch`, { method: 'PUT', body: JSON.stringify(elements) }),
  delete: (id: string) => request<{ message: string }>(`/elements/${id}`, { method: 'DELETE' }),
};

// Events API
export const apiEvents = {
  getAll: () => request<AppEvent[]>('/events'),
  getById: (id: string) => request<AppEvent>(`/events/${id}`),
  create: (data: Partial<AppEvent>) => request<AppEvent>('/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<AppEvent>) => request<AppEvent>(`/events/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<{ message: string }>(`/events/${id}`, { method: 'DELETE' }),
};

// Attendees API
export const apiAttendees = {
  getByEvent: (eventId: string) => request<Attendee[]>(`/events/${eventId}/attendees`),
  create: (data: Partial<Attendee>) => request<Attendee>('/attendees', { method: 'POST', body: JSON.stringify(data) }),
  importBatch: (eventId: string, list: Partial<Attendee>[]) =>
    request<{ message: string; count: number }>(`/events/${eventId}/attendees/batch`, { method: 'POST', body: JSON.stringify(list) }),
  update: (id: string, data: Partial<Attendee>) => request<Attendee>(`/attendees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => request<{ message: string }>(`/attendees/${id}`, { method: 'DELETE' }),
};

// Assignments API
export const apiAssignments = {
  getByEvent: (eventId: string) => request<Assignment[]>(`/events/${eventId}/assignments`),
  assign: (eventId: string, elementId: string, attendeeId: string | null) =>
    request<Assignment>('/assignments', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId, element_id: elementId, attendee_id: attendeeId }),
    }),
  unassign: (id: string) => request<{ message: string }>(`/assignments/${id}`, { method: 'DELETE' }),
  autoAssign: (eventId: string, mode: string = 'alphabetical') =>
    request<{ message: string; assigned_count: number }>(`/events/${eventId}/auto-assign?mode=${mode}`, { method: 'POST' }),
};

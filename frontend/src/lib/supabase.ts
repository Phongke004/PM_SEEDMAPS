import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Hall = {
  id: string;
  name: string;
  description: string;
  row_count: number;
  col_count: number;
  created_at: string;
  updated_at: string;
};

export type ElementType = 'chair' | 'table' | 'stage' | 'door' | 'wall' | 'zone';

export type SeatType = 'delegate' | 'guest';

export type HallElement = {
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
};

export type EventStatus = 'planning' | 'open' | 'assigned' | 'completed';

export type AppEvent = {
  id: string;
  name: string;
  description: string;
  hall_id: string;
  event_date: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type AttendeeStatus = 'pending' | 'assigned' | 'absent' | 'attended';

export type Attendee = {
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
};

export type Assignment = {
  id: string;
  event_id: string;
  element_id: string;
  attendee_id: string | null;
  status: string;
  created_at: string;
};

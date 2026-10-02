/*
# Seat Map Designer & Assignment - Core Schema

## Overview
Creates the database schema for a hospital auditorium seat map designer and assignment system.
Single-tenant app (no sign-in), all policies allow anon + authenticated access.

## New Tables
1. **halls** - Auditorium/hall definitions (name, rows, columns, description)
2. **seats** - Individual seat definitions within a hall (row, column, label, type, status)
3. **events** - Events scheduled in halls (name, date, hall_id)
4. **attendees** - People attending events (name, department, phone, email)
5. **assignments** - Seat assignments linking attendees to seats for events
*/

-- Halls table
CREATE TABLE IF NOT EXISTS halls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  row_count integer NOT NULL DEFAULT 10,
  col_count integer NOT NULL DEFAULT 10,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE halls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_halls" ON halls;
CREATE POLICY "anon_select_halls" ON halls FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_halls" ON halls;
CREATE POLICY "anon_insert_halls" ON halls FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_halls" ON halls;
CREATE POLICY "anon_update_halls" ON halls FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_halls" ON halls;
CREATE POLICY "anon_delete_halls" ON halls FOR DELETE
  TO anon, authenticated USING (true);

-- Seats table
CREATE TABLE IF NOT EXISTS seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id uuid NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  row_index integer NOT NULL,
  col_index integer NOT NULL,
  label text NOT NULL DEFAULT '',
  seat_type text NOT NULL DEFAULT 'delegate',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(hall_id, row_index, col_index)
);

ALTER TABLE seats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_seats" ON seats;
CREATE POLICY "anon_select_seats" ON seats FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_seats" ON seats;
CREATE POLICY "anon_insert_seats" ON seats FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_seats" ON seats;
CREATE POLICY "anon_update_seats" ON seats FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_seats" ON seats;
CREATE POLICY "anon_delete_seats" ON seats FOR DELETE
  TO anon, authenticated USING (true);

-- Events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  hall_id uuid NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  event_date timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'planning',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_events" ON events;
CREATE POLICY "anon_select_events" ON events FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_events" ON events;
CREATE POLICY "anon_insert_events" ON events FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_events" ON events;
CREATE POLICY "anon_update_events" ON events FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_events" ON events;
CREATE POLICY "anon_delete_events" ON events FOR DELETE
  TO anon, authenticated USING (true);

-- Attendees table
CREATE TABLE IF NOT EXISTS attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  department text DEFAULT '',
  phone text DEFAULT '',
  email text DEFAULT '',
  notes text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_attendees" ON attendees;
CREATE POLICY "anon_select_attendees" ON attendees FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_attendees" ON attendees;
CREATE POLICY "anon_insert_attendees" ON attendees FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_attendees" ON attendees;
CREATE POLICY "anon_update_attendees" ON attendees FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_attendees" ON attendees;
CREATE POLICY "anon_delete_attendees" ON attendees FOR DELETE
  TO anon, authenticated USING (true);

-- Assignments table
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  seat_id uuid NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  attendee_id uuid REFERENCES attendees(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'assigned',
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, seat_id)
);

ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_assignments" ON assignments;
CREATE POLICY "anon_select_assignments" ON assignments FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_assignments" ON assignments;
CREATE POLICY "anon_insert_assignments" ON assignments FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_assignments" ON assignments;
CREATE POLICY "anon_update_assignments" ON assignments FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_assignments" ON assignments;
CREATE POLICY "anon_delete_assignments" ON assignments FOR DELETE
  TO anon, authenticated USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_seats_hall_id ON seats(hall_id);
CREATE INDEX IF NOT EXISTS idx_events_hall_id ON events(hall_id);
CREATE INDEX IF NOT EXISTS idx_attendees_event_id ON attendees(event_id);
CREATE INDEX IF NOT EXISTS idx_assignments_event_id ON assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_assignments_seat_id ON assignments(seat_id);
CREATE INDEX IF NOT EXISTS idx_assignments_attendee_id ON assignments(attendee_id);

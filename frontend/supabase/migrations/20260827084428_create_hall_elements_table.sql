-- Drop old tables (app is new, no real data to preserve)
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS seats;

-- Create hall_elements table for free-form canvas design
CREATE TABLE hall_elements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hall_id uuid NOT NULL REFERENCES halls(id) ON DELETE CASCADE,
  element_type text NOT NULL DEFAULT 'chair',
  x float NOT NULL DEFAULT 0,
  y float NOT NULL DEFAULT 0,
  width float NOT NULL DEFAULT 36,
  height float NOT NULL DEFAULT 36,
  rotation float NOT NULL DEFAULT 0,
  label text DEFAULT '',
  seat_type text DEFAULT 'delegate',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE hall_elements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_hall_elements" ON hall_elements;
CREATE POLICY "anon_select_hall_elements" ON hall_elements FOR SELECT
  TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_hall_elements" ON hall_elements;
CREATE POLICY "anon_insert_hall_elements" ON hall_elements FOR INSERT
  TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_hall_elements" ON hall_elements;
CREATE POLICY "anon_update_hall_elements" ON hall_elements FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_hall_elements" ON hall_elements;
CREATE POLICY "anon_delete_hall_elements" ON hall_elements FOR DELETE
  TO anon, authenticated USING (true);

-- Recreate assignments table with FK to hall_elements
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  element_id uuid NOT NULL REFERENCES hall_elements(id) ON DELETE CASCADE,
  attendee_id uuid REFERENCES attendees(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'assigned',
  created_at timestamptz DEFAULT now(),
  UNIQUE(event_id, element_id)
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
CREATE INDEX IF NOT EXISTS idx_hall_elements_hall_id ON hall_elements(hall_id);
CREATE INDEX IF NOT EXISTS idx_assignments_event_id ON assignments(event_id);
CREATE INDEX IF NOT EXISTS idx_assignments_element_id ON assignments(element_id);
CREATE INDEX IF NOT EXISTS idx_assignments_attendee_id ON assignments(attendee_id);
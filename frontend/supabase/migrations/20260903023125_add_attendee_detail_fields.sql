/*
# Add detail fields to attendees table

## Overview
Adds new columns to the `attendees` table to support richer display on the seat map and LED preview.

## Changes
1. **attendees** table — new columns:
   - `title` (text) — Quân hàm / học vị, e.g. "GS.TS", "ThS", "BS.CK1". For delegate seats.
   - `position` (text) — Chức vụ, e.g. "Giám đốc", "Trưởng khoa". For delegate seats.
   - `degree` (text) — Học vị, e.g. "Tiến sĩ", "Thạc sĩ". For delegate seats.
   The existing `department` field is used for guest seats (khoa/phòng/ban).

2. **Security**
   - No new tables. No policy changes needed — existing CRUD policies on `attendees` already cover all columns.

## Notes
- All new columns are nullable with default '' so existing rows are unaffected.
- The app is single-tenant (no sign-in), so existing `TO anon, authenticated` policies continue to apply.
*/

ALTER TABLE attendees
  ADD COLUMN IF NOT EXISTS title text DEFAULT '',
  ADD COLUMN IF NOT EXISTS position text DEFAULT '',
  ADD COLUMN IF NOT EXISTS degree text DEFAULT '';
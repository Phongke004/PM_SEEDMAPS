/*
# Update seat types to delegate/guest/empty

## Overview
Simplifies seat types from 6 categories (normal, vip, reserved, disabled, aisle, empty)
to just 3: delegate (đại biểu), guest (khách mời), empty (ô trống).

## Changes
1. Update existing seats: normal/reserved/disabled -> delegate, vip -> guest, aisle -> empty
2. Change column default from 'normal' to 'delegate'
*/

-- Migrate existing seat types
UPDATE seats SET seat_type = 'delegate' WHERE seat_type IN ('normal', 'reserved', 'disabled');
UPDATE seats SET seat_type = 'guest' WHERE seat_type = 'vip';
UPDATE seats SET seat_type = 'empty' WHERE seat_type = 'aisle';

-- Update default
ALTER TABLE seats ALTER COLUMN seat_type SET DEFAULT 'delegate';

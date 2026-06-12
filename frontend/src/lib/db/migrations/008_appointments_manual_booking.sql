-- Manual (admin-created) bookings use scheduled_at + doctor, not the public
-- form's email / preferred date+time triple. Relax those to nullable; the
-- public booking API still requires them at the validation layer.
-- Run: psql -d sayandent -f src/lib/db/migrations/008_appointments_manual_booking.sql

ALTER TABLE appointments ALTER COLUMN email DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN preferred_date DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN preferred_time DROP NOT NULL;

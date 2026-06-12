-- Doctors are employees, not public-site staff profiles. Repoint the
-- appointment/availability foreign keys from staff(id) to employees(id).
-- Both tables are empty at migration time, so no data backfill is needed.
-- Run: psql -d sayandent -f src/lib/db/migrations/007_doctor_fk_employees.sql

ALTER TABLE appointments
  DROP CONSTRAINT IF EXISTS appointments_doctor_id_fkey;
ALTER TABLE appointments
  ADD CONSTRAINT appointments_doctor_id_fkey
  FOREIGN KEY (doctor_id) REFERENCES employees(id) ON DELETE SET NULL;

ALTER TABLE doctor_unavailable_blocks
  DROP CONSTRAINT IF EXISTS doctor_unavailable_blocks_doctor_id_fkey;
ALTER TABLE doctor_unavailable_blocks
  ADD CONSTRAINT doctor_unavailable_blocks_doctor_id_fkey
  FOREIGN KEY (doctor_id) REFERENCES employees(id) ON DELETE CASCADE;

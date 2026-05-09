-- Calendar-ready appointments + doctor off-blocks
-- Run: psql -d sayandent -f src/lib/db/migrations/002_appointments_calendar.sql

BEGIN;

-- ──────────────────────────────────────────
-- New enums
-- ──────────────────────────────────────────
CREATE TYPE appointment_source AS ENUM ('online', 'manual');

CREATE TYPE appointment_status_v2 AS ENUM (
  'booked',
  'arrived',
  'examined',
  'paid',
  'cancelled_by_patient',
  'cancelled_by_doctor'
);

-- ──────────────────────────────────────────
-- Migrate appointments to the new status enum
--   Existing values: pending|confirmed → booked, completed → paid, cancelled → cancelled_by_patient
-- ──────────────────────────────────────────
ALTER TABLE appointments
  ALTER COLUMN status DROP DEFAULT,
  ALTER COLUMN status TYPE appointment_status_v2
    USING (CASE status::text
             WHEN 'pending'   THEN 'booked'
             WHEN 'confirmed' THEN 'booked'
             WHEN 'completed' THEN 'paid'
             WHEN 'cancelled' THEN 'cancelled_by_patient'
           END)::appointment_status_v2,
  ALTER COLUMN status SET DEFAULT 'booked';

DROP TYPE appointment_status;
ALTER TYPE appointment_status_v2 RENAME TO appointment_status;

-- ──────────────────────────────────────────
-- New columns
-- ──────────────────────────────────────────
ALTER TABLE appointments
  ADD COLUMN source appointment_source NOT NULL DEFAULT 'online',
  ADD COLUMN scheduled_at TIMESTAMPTZ,
  ADD COLUMN duration_minutes INT NOT NULL DEFAULT 30,
  ADD COLUMN doctor_id UUID REFERENCES staff(id) ON DELETE SET NULL;

CREATE INDEX idx_appointments_scheduled_at ON appointments (scheduled_at);
CREATE INDEX idx_appointments_doctor_id ON appointments (doctor_id);

-- ──────────────────────────────────────────
-- Doctor off-blocks (Эмчийн ажиллахгүй цаг)
--   Used when a doctor is on leave / unavailable. Rendered on the same calendar.
-- ──────────────────────────────────────────
CREATE TABLE doctor_unavailable_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  CHECK (ends_at > starts_at)
);

CREATE INDEX idx_doctor_unavailable_starts_at ON doctor_unavailable_blocks (starts_at);
CREATE INDEX idx_doctor_unavailable_doctor_id ON doctor_unavailable_blocks (doctor_id);

CREATE TRIGGER trg_doctor_unavailable_updated_at
  BEFORE UPDATE ON doctor_unavailable_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;

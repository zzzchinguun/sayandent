-- Treatment line items recorded during a visit (Эмчилгээ step), plus
-- visit-level exam fields on the appointment itself.
-- Run: psql -d sayandent -f src/lib/db/migrations/009_appointment_treatments.sql

CREATE TABLE IF NOT EXISTS appointment_treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  tooth_code TEXT,           -- FDI number ('14'), 'all', or NULL for non-tooth treatments
  tooth_label TEXT,          -- human label: 'баруун дээд байнгын 1-р бага араа'
  diagnosis_code TEXT,       -- ICD code, e.g. 'К02.1'
  diagnosis_name TEXT,
  treatment_name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointment_treatments_appt
  ON appointment_treatments (appointment_id);

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS complaint TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS insured BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS exam_fee INTEGER NOT NULL DEFAULT 0;

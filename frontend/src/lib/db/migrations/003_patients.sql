-- Patients table
-- Run: psql -d sayandent -f src/lib/db/migrations/003_patients.sql

CREATE TYPE gender AS ENUM ('male', 'female');
CREATE TYPE patient_type AS ENUM ('regular', 'bronze', 'silver', 'gold');
CREATE TYPE payment_status AS ENUM ('paid', 'unpaid');

CREATE SEQUENCE patients_card_seq START WITH 1;

CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number INT NOT NULL DEFAULT nextval('patients_card_seq') UNIQUE,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  date_of_birth DATE,
  registry_number TEXT UNIQUE,
  gender gender,
  phone TEXT NOT NULL,
  phone2 TEXT,
  province TEXT,
  district TEXT,
  address TEXT,
  email TEXT,
  has_allergy BOOLEAN NOT NULL DEFAULT false,
  allergies TEXT,
  patient_type patient_type NOT NULL DEFAULT 'regular',
  payment_status payment_status NOT NULL DEFAULT 'unpaid',
  form_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_patients_phone ON patients (phone);
CREATE INDEX idx_patients_name ON patients (last_name, first_name);
CREATE INDEX idx_patients_card_number ON patients (card_number);
CREATE INDEX idx_patients_registry ON patients (registry_number);
CREATE INDEX idx_patients_created_at ON patients (created_at);

CREATE TRIGGER trg_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

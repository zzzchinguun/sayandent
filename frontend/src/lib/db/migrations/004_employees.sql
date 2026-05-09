-- Employees (Ажилчид) table
-- Run: psql -d sayandent -f src/lib/db/migrations/004_employees.sql

CREATE TYPE employee_role AS ENUM ('receptionist', 'doctor', 'admin');

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  registry_number TEXT UNIQUE,
  email TEXT,
  role employee_role NOT NULL DEFAULT 'doctor',
  phone TEXT,
  branch TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_employees_role ON employees (role);
CREATE INDEX idx_employees_name ON employees (last_name, first_name);

CREATE TRIGGER trg_employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

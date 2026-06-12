-- Employee login: employees sign in with their email + password.
-- Run: psql -d sayandent -f src/lib/db/migrations/006_employee_auth.sql

ALTER TABLE employees ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Email must be unique among non-deleted employees for login lookup.
CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_email_unique
  ON employees (lower(email))
  WHERE deleted_at IS NULL AND email IS NOT NULL;

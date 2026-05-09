-- Internal wishlist: staff leave detailed requests / wishes for the developer.
-- Run: psql -d sayandent -f src/lib/db/migrations/005_wishlist.sql

CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by_email TEXT,
  created_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_wishlist_created_at ON wishlist (created_at DESC);

CREATE TRIGGER trg_wishlist_updated_at
  BEFORE UPDATE ON wishlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

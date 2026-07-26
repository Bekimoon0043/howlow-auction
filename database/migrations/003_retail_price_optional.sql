-- ============================================================
-- Migration 003: retail_price is no longer collected in the UI
-- ============================================================
-- We keep the column (resolve_auction() still records it on the
-- winners table for historical stats), but it's now optional and
-- defaults to 0 since admins are no longer asked for it.

ALTER TABLE products
  ALTER COLUMN retail_price DROP NOT NULL,
  ALTER COLUMN retail_price SET DEFAULT 0;

ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_retail_price_check;

ALTER TABLE products
  ADD CONSTRAINT products_retail_price_check CHECK (retail_price >= 0);

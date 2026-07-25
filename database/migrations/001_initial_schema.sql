-- HowLow Auction Platform - Complete Production Schema
-- Currency: ETB | Phone: Ethiopian E.164 | Auth: synthetic email

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ============================================================
-- HELPER: Normalize Ethiopian phone
-- ============================================================
CREATE OR REPLACE FUNCTION normalize_ethiopian_phone(raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned text;
BEGIN
  cleaned := regexp_replace(raw, '[^0-9+]', '', 'g');
  IF cleaned ~ '^09[0-9]{8}$' THEN
    cleaned := '+251' || substring(cleaned from 2);
  ELSIF cleaned ~ '^07[0-9]{8}$' THEN
    cleaned := '+251' || substring(cleaned from 2);
  ELSIF cleaned ~ '^2519[0-9]{8}$' THEN
    cleaned := '+' || cleaned;
  ELSIF cleaned ~ '^2517[0-9]{8}$' THEN
    cleaned := '+' || cleaned;
  ELSIF cleaned ~ '^\+2519[0-9]{8}$' OR cleaned ~ '^\+2517[0-9]{8}$' THEN
    -- already good
    NULL;
  ELSE
    RAISE EXCEPTION 'Invalid Ethiopian mobile number: %', raw;
  END IF;
  RETURN cleaned;
END;
$$;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  is_banned BOOLEAN NOT NULL DEFAULT false,
  is_frozen BOOLEAN NOT NULL DEFAULT false,
  locale TEXT NOT NULL DEFAULT 'am',
  referral_code TEXT UNIQUE,
  referred_by UUID REFERENCES profiles(id),
  wins_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT phone_e164_check CHECK (phone_number ~ '^\+251[79][0-9]{8}$')
);

CREATE UNIQUE INDEX profiles_phone_number_uidx ON profiles (phone_number);
CREATE INDEX profiles_display_name_idx ON profiles (display_name);

-- ============================================================
-- WALLETS & CREDITS
-- ============================================================
CREATE TABLE wallets (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency TEXT NOT NULL DEFAULT 'ETB',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE user_bid_credits (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  credits INTEGER NOT NULL DEFAULT 0 CHECK (credits >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'deposit', 'withdrawal', 'bid_cost', 'credit_purchase',
    'admin_credit', 'admin_debit', 'refund', 'shipping', 'referral_bonus'
  )),
  amount NUMERIC(14,2) NOT NULL,
  balance_before NUMERIC(14,2),
  balance_after NUMERIC(14,2),
  credits_before INT,
  credits_after INT,
  reference_id UUID,
  note TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX transactions_user_id_idx ON transactions (user_id, created_at DESC);

CREATE TABLE deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'rejected')),
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX deposit_requests_status_idx ON deposit_requests (status) WHERE status = 'pending';

-- ============================================================
-- BID CREDIT PACKAGES
-- ============================================================
CREATE TABLE bid_credit_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_am TEXT NOT NULL,
  name_en TEXT NOT NULL,
  credits INTEGER NOT NULL CHECK (credits > 0),
  price_etb NUMERIC(14,2) NOT NULL CHECK (price_etb > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- CATEGORIES & PRODUCTS
-- ============================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_am TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES categories(id),
  title_am TEXT NOT NULL,
  title_en TEXT NOT NULL,
  description_am TEXT,
  description_en TEXT,
  retail_price NUMERIC(14,2) NOT NULL CHECK (retail_price > 0),
  reserve_price NUMERIC(14,2),
  shipping_cost NUMERIC(14,2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- AUCTIONS & BIDS
-- ============================================================
CREATE TABLE auctions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'scheduled', 'active', 'paused', 'ended', 'cancelled', 'no_winner'
  )),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  bid_cost INTEGER NOT NULL DEFAULT 1 CHECK (bid_cost > 0),
  min_bid NUMERIC(14,2) NOT NULL DEFAULT 0.01,
  max_bid NUMERIC(14,2),
  participant_count INT NOT NULL DEFAULT 0,
  total_bids INT NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX auctions_status_end_time_idx ON auctions (status, end_time);

CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (auction_id, user_id, amount)
);

CREATE INDEX bids_auction_id_idx ON bids (auction_id);
CREATE INDEX bids_user_id_idx ON bids (user_id);

-- ============================================================
-- WINNERS & ORDERS
-- ============================================================
CREATE TABLE winners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL UNIQUE REFERENCES auctions(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  winning_bid NUMERIC(14,2) NOT NULL,
  retail_price NUMERIC(14,2) NOT NULL,
  savings NUMERIC(14,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE shipping_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  subcity TEXT,
  woreda TEXT,
  detail_address TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  winner_id UUID NOT NULL UNIQUE REFERENCES winners(id),
  user_id UUID NOT NULL REFERENCES profiles(id),
  shipping_address_id UUID REFERENCES shipping_addresses(id),
  status TEXT NOT NULL DEFAULT 'pending_address' CHECK (status IN (
    'pending_address', 'processing', 'shipped', 'delivered', 'cancelled'
  )),
  tracking_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- NOTIFICATIONS, ADMINS, SETTINGS, LOGS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title_am TEXT NOT NULL,
  title_en TEXT NOT NULL,
  body_am TEXT,
  body_en TEXT,
  type TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX notifications_user_unread_idx ON notifications (user_id) WHERE is_read = false;

CREATE TABLE admins (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO settings (key, value) VALUES
  ('admin_telegram_username', '"HowLowAdmin"'),
  ('currency', '"ETB"'),
  ('default_locale', '"am"'),
  ('default_bid_cost', '1'),
  ('default_auction_duration_hours', '72'),
  ('min_bid', '0.01'),
  ('max_bid', '100000'),
  ('shipping_fee_default', '150');

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  meta JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TRIGGER: create profile + wallet + credits on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_phone text;
  v_name text;
  v_code text;
BEGIN
  v_phone := normalize_ethiopian_phone(
    COALESCE(NEW.raw_user_meta_data->>'phone_number', '')
  );
  v_name := COALESCE(NEW.raw_user_meta_data->>'display_name', 'User');
  v_code := upper(substr(md5(NEW.id::text), 1, 8));

  INSERT INTO profiles (id, phone_number, display_name, referral_code)
  VALUES (NEW.id, v_phone, v_name, v_code);

  INSERT INTO wallets (user_id) VALUES (NEW.id);
  INSERT INTO user_bid_credits (user_id) VALUES (NEW.id);

  RETURN NEW;
EXCEPTION WHEN unique_violation THEN
  RAISE EXCEPTION 'An account already exists for this phone number.';
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCTION: place_bid (atomic)
-- ============================================================
CREATE OR REPLACE FUNCTION place_bid(p_auction_id UUID, p_amount NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_auction auctions%ROWTYPE;
  v_credits INT;
  v_bid_cost INT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Auction not found'; END IF;
  IF v_auction.status <> 'active' THEN RAISE EXCEPTION 'Auction is not active'; END IF;
  IF v_auction.end_time <= now() THEN RAISE EXCEPTION 'Auction has ended'; END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE id = v_user AND (is_banned OR is_frozen)) THEN
    RAISE EXCEPTION 'Account is restricted';
  END IF;

  IF p_amount < v_auction.min_bid OR (v_auction.max_bid IS NOT NULL AND p_amount > v_auction.max_bid) THEN
    RAISE EXCEPTION 'Bid amount out of allowed range';
  END IF;

  -- Round to 2 decimals
  p_amount := round(p_amount, 2);

  IF EXISTS (
    SELECT 1 FROM bids WHERE auction_id = p_auction_id AND user_id = v_user AND amount = p_amount
  ) THEN
    RAISE EXCEPTION 'You already placed this bid amount on this auction';
  END IF;

  SELECT credits INTO v_credits FROM user_bid_credits WHERE user_id = v_user FOR UPDATE;
  v_bid_cost := v_auction.bid_cost;

  IF v_credits < v_bid_cost THEN
    RAISE EXCEPTION 'Insufficient bid credits';
  END IF;

  UPDATE user_bid_credits
  SET credits = credits - v_bid_cost, updated_at = now()
  WHERE user_id = v_user;

  INSERT INTO bids (auction_id, user_id, amount)
  VALUES (p_auction_id, v_user, p_amount);

  UPDATE auctions
  SET total_bids = total_bids + 1,
      participant_count = (
        SELECT COUNT(DISTINCT user_id) FROM bids WHERE auction_id = p_auction_id
      ),
      updated_at = now()
  WHERE id = p_auction_id;

  INSERT INTO transactions (user_id, type, amount, credits_before, credits_after, reference_id, note)
  VALUES (v_user, 'bid_cost', v_bid_cost, v_credits, v_credits - v_bid_cost, p_auction_id, 'Bid placed');

  RETURN jsonb_build_object('success', true, 'remaining_credits', v_credits - v_bid_cost);
END;
$$;

-- ============================================================
-- FUNCTION: resolve_auction (Lowest Unique Bid)
-- ============================================================
CREATE OR REPLACE FUNCTION resolve_auction(p_auction_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_auction auctions%ROWTYPE;
  v_winner_bid NUMERIC;
  v_winner_user UUID;
  v_retail NUMERIC;
  v_product products%ROWTYPE;
BEGIN
  SELECT * INTO v_auction FROM auctions WHERE id = p_auction_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Auction not found'; END IF;
  IF v_auction.status NOT IN ('active', 'paused') THEN
    RETURN jsonb_build_object('status', 'already_resolved');
  END IF;

  -- Lowest Unique Bid
  SELECT b.amount, b.user_id INTO v_winner_bid, v_winner_user
  FROM bids b
  WHERE b.auction_id = p_auction_id
  GROUP BY b.amount, b.user_id
  HAVING COUNT(*) FILTER (WHERE true) = 1  -- unique by amount across all users
  -- actually we need amounts that appear only once globally
  ;

  -- Correct LUB query:
  WITH counts AS (
    SELECT amount, COUNT(*) AS cnt, MIN(user_id) AS any_user
    FROM bids
    WHERE auction_id = p_auction_id
    GROUP BY amount
  ),
  unique_bids AS (
    SELECT c.amount, b.user_id
    FROM counts c
    JOIN bids b ON b.auction_id = p_auction_id AND b.amount = c.amount
    WHERE c.cnt = 1
  )
  SELECT amount, user_id INTO v_winner_bid, v_winner_user
  FROM unique_bids
  ORDER BY amount ASC
  LIMIT 1;

  SELECT * INTO v_product FROM products WHERE id = v_auction.product_id;
  v_retail := v_product.retail_price;

  IF v_winner_user IS NULL THEN
    UPDATE auctions SET status = 'no_winner', updated_at = now() WHERE id = p_auction_id;
    RETURN jsonb_build_object('status', 'no_winner');
  END IF;

  INSERT INTO winners (auction_id, user_id, winning_bid, retail_price, savings)
  VALUES (p_auction_id, v_winner_user, v_winner_bid, v_retail, v_retail - v_winner_bid);

  INSERT INTO orders (winner_id, user_id)
  SELECT id, user_id FROM winners WHERE auction_id = p_auction_id;

  UPDATE auctions SET status = 'ended', updated_at = now() WHERE id = p_auction_id;

  UPDATE profiles SET wins_count = wins_count + 1 WHERE id = v_winner_user;

  INSERT INTO notifications (user_id, title_am, title_en, body_am, body_en, type, data)
  VALUES (
    v_winner_user,
    'አሸንፈዋል!',
    'You Won!',
    'በዝቅተኛ ልዩ ጨረታ አሸንፈዋል።',
    'You won the lowest unique bid auction.',
    'winner',
    jsonb_build_object('auction_id', p_auction_id, 'winning_bid', v_winner_bid)
  );

  RETURN jsonb_build_object(
    'status', 'winner',
    'user_id', v_winner_user,
    'winning_bid', v_winner_bid
  );
END;
$$;

-- ============================================================
-- FUNCTION: admin_adjust_wallet
-- ============================================================
CREATE OR REPLACE FUNCTION admin_adjust_wallet(
  p_target_user UUID,
  p_amount NUMERIC,
  p_type TEXT,          -- 'admin_credit' | 'admin_debit'
  p_note TEXT DEFAULT NULL,
  p_deposit_request_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID := auth.uid();
  v_before NUMERIC;
  v_after NUMERIC;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = v_admin) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT balance INTO v_before FROM wallets WHERE user_id = p_target_user FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'User wallet not found'; END IF;

  IF p_type = 'admin_credit' THEN
    v_after := v_before + p_amount;
  ELSIF p_type = 'admin_debit' THEN
    IF v_before < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
    v_after := v_before - p_amount;
  ELSE
    RAISE EXCEPTION 'Invalid type';
  END IF;

  UPDATE wallets SET balance = v_after, updated_at = now() WHERE user_id = p_target_user;

  INSERT INTO transactions (user_id, type, amount, balance_before, balance_after, note, created_by, reference_id)
  VALUES (p_target_user, p_type, p_amount, v_before, v_after, p_note, v_admin, p_deposit_request_id);

  IF p_deposit_request_id IS NOT NULL THEN
    UPDATE deposit_requests
    SET status = 'resolved', resolved_by = v_admin, resolved_at = now()
    WHERE id = p_deposit_request_id AND status = 'pending';
  END IF;

  INSERT INTO notifications (user_id, title_am, title_en, body_am, body_en, type, data)
  VALUES (
    p_target_user,
    CASE WHEN p_type = 'admin_credit' THEN 'ዋሌት ተሞልቷል' ELSE 'ዋሌት ቀንሷል' END,
    CASE WHEN p_type = 'admin_credit' THEN 'Wallet Credited' ELSE 'Wallet Debited' END,
    p_amount::text || ' ETB',
    p_amount::text || ' ETB',
    'wallet',
    jsonb_build_object('amount', p_amount, 'type', p_type)
  );

  RETURN jsonb_build_object('success', true, 'new_balance', v_after);
END;
$$;

-- Similar function for bid credits
CREATE OR REPLACE FUNCTION admin_adjust_credits(
  p_target_user UUID,
  p_credits INT,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin UUID := auth.uid();
  v_before INT;
  v_after INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = v_admin) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT credits INTO v_before FROM user_bid_credits WHERE user_id = p_target_user FOR UPDATE;
  v_after := v_before + p_credits;
  IF v_after < 0 THEN RAISE EXCEPTION 'Credits cannot go negative'; END IF;

  UPDATE user_bid_credits SET credits = v_after, updated_at = now() WHERE user_id = p_target_user;

  INSERT INTO transactions (user_id, type, amount, credits_before, credits_after, note, created_by)
  VALUES (p_target_user, 'credit_purchase', abs(p_credits), v_before, v_after, p_note, v_admin);

  INSERT INTO notifications (user_id, title_am, title_en, body_am, body_en, type)
  VALUES (
    p_target_user,
    'ቢድ ክሬዲት ተጨምሯል',
    'Bid Credits Added',
    p_credits::text || ' credits',
    p_credits::text || ' credits',
    'credits'
  );

  RETURN jsonb_build_object('success', true, 'new_credits', v_after);
END;
$$;

-- ============================================================
-- CRON: resolve ended auctions every minute
-- ============================================================
-- Run after enabling pg_cron in Supabase dashboard:
-- SELECT cron.schedule('resolve-auctions', '* * * * *', $$
--   SELECT resolve_auction(id) FROM auctions
--   WHERE status = 'active' AND end_time <= now();
-- $$);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bid_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_credit_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid());
$$;

-- Profiles
CREATE POLICY profiles_select ON profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY profiles_admin ON profiles FOR ALL USING (is_admin());

-- Wallets
CREATE POLICY wallets_select_own ON wallets FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY wallets_admin ON wallets FOR ALL USING (is_admin());

-- Credits
CREATE POLICY credits_select_own ON user_bid_credits FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY credits_admin ON user_bid_credits FOR ALL USING (is_admin());

-- Transactions
CREATE POLICY tx_select_own ON transactions FOR SELECT USING (user_id = auth.uid() OR is_admin());

-- Deposit requests
CREATE POLICY dep_select_own ON deposit_requests FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY dep_insert_own ON deposit_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY dep_admin ON deposit_requests FOR ALL USING (is_admin());

-- Packages & categories & products – public read
CREATE POLICY packages_read ON bid_credit_packages FOR SELECT USING (is_active OR is_admin());
CREATE POLICY packages_admin ON bid_credit_packages FOR ALL USING (is_admin());
CREATE POLICY categories_read ON categories FOR SELECT USING (is_active OR is_admin());
CREATE POLICY categories_admin ON categories FOR ALL USING (is_admin());
CREATE POLICY products_read ON products FOR SELECT USING (is_active OR is_admin());
CREATE POLICY products_admin ON products FOR ALL USING (is_admin());
CREATE POLICY product_images_read ON product_images FOR SELECT USING (true);
CREATE POLICY product_images_admin ON product_images FOR ALL USING (is_admin());

-- Auctions – public read of non-draft
CREATE POLICY auctions_read ON auctions FOR SELECT USING (status <> 'draft' OR is_admin());
CREATE POLICY auctions_admin ON auctions FOR ALL USING (is_admin());

-- BIDS – critical: only own bids while active, or admin, or after end
CREATE POLICY bids_select ON bids FOR SELECT USING (
  user_id = auth.uid()
  OR is_admin()
  OR EXISTS (
    SELECT 1 FROM auctions a
    WHERE a.id = bids.auction_id AND a.status IN ('ended', 'no_winner')
  )
);
-- Insert only via place_bid function (SECURITY DEFINER)

-- Winners public after creation
CREATE POLICY winners_read ON winners FOR SELECT USING (true);
CREATE POLICY winners_admin ON winners FOR ALL USING (is_admin());

-- Shipping & orders
CREATE POLICY ship_own ON shipping_addresses FOR ALL USING (user_id = auth.uid() OR is_admin());
CREATE POLICY orders_own ON orders FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY orders_admin ON orders FOR ALL USING (is_admin());

-- Notifications
CREATE POLICY notif_own ON notifications FOR ALL USING (user_id = auth.uid() OR is_admin());

-- Admins & settings & logs
CREATE POLICY admins_read ON admins FOR SELECT USING (is_admin());
CREATE POLICY settings_read ON settings FOR SELECT USING (true);
CREATE POLICY settings_admin ON settings FOR ALL USING (is_admin());
CREATE POLICY logs_admin ON activity_logs FOR ALL USING (is_admin());

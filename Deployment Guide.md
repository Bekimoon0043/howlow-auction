# Deployment Guide – HowLow on Replit + Supabase

## 1. Supabase Setup

1. Create a new Supabase project.
2. Go to **SQL Editor** and run `database/migrations/001_initial_schema.sql` in full.
3. Enable extensions: `pgcrypto`, `pg_cron` (Database → Extensions).
4. Schedule the auction resolver:
   ```sql
   SELECT cron.schedule(
     'resolve-auctions',
     '* * * * *',
     $$SELECT resolve_auction(id) FROM auctions WHERE status = 'active' AND end_time <= now()$$
   );
   ```
5. Create Storage bucket `product-images` (public).
6. Auth → Providers → Email: enabled (used internally only).
7. Copy Project URL, anon key, service_role key.

## 2. Replit Setup

1. Import the GitHub repo into Replit.
2. Add Secrets (Replit Secrets tab):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `PORT=3001`
3. In Shell:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```
4. Create a `.replit` run config that starts both client and server (or use two workflows).

## 3. First Admin User

1. Sign up normally via the app with your phone.
2. In Supabase SQL:
   ```sql
   INSERT INTO admins (user_id)
   SELECT id FROM profiles WHERE phone_number = '+2519xxxxxxxx';
   ```
3. Log out / log in – you will see Admin Dashboard link.

## 4. Production

- Use **Replit Deployments** for the combined app.
- Point custom domain if desired.
- Set `NODE_ENV=production`.
- Never expose service_role key to the client.

## 5. Post-deploy checklist

- [ ] Telegram username set in Admin → Settings
- [ ] At least one product + active auction
- [ ] Bid credit packages seeded
- [ ] Test place_bid as normal user
- [ ] Test admin_adjust_wallet
- [ ] Verify bids stay hidden until auction ends

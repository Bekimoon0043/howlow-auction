# Environment Variables

All secrets must be stored in **Replit Secrets**. Never commit real keys.

## Client (Vite)

These are prefixed with `VITE_` and are safe to expose to the browser (anon key only).

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_APP_NAME=HowLow
VITE_DEFAULT_LOCALE=am
VITE_CURRENCY=ETB
VITE_TELEGRAM_BOT_USERNAME=          # optional, for deep links
```

## Server (Replit Node.js)

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   # NEVER expose to frontend
PORT=3001
NODE_ENV=production
JWT_SECRET=generate-a-long-random-string
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
ADMIN_TELEGRAM_FALLBACK=@your_admin_username
```

## Supabase Dashboard Settings

- Auth → Enable Email provider (used internally with synthetic emails)
- Auth → Disable phone/SMS provider (we do not use it)
- Storage → Create bucket `product-images` (public read, authenticated write via RLS)
- Database → Enable `pg_cron` extension for auction resolution jobs

## Synthetic Email Domain

Internal only: `howlow.internal`  
Example: phone `+251912345678` → email `251912345678@howlow.internal`

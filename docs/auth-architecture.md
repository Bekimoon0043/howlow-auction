# Phone-Only Authentication Architecture

## Why Synthetic Email?

Supabase Auth’s native phone OTP requires a paid SMS provider.  
We avoid that cost while still using full Auth (JWT, RLS, sessions).

## Flow

### Signup
1. User enters: Phone (`+2519…` or `+2517…`) + Password + optional Display Name
2. Client normalizes to E.164
3. Client checks `profiles` for existing phone (UX)
4. Client builds synthetic email: `phone.replace('+', '') + '@howlow.internal'`
5. `supabase.auth.signUp({ email, password, options: { data: { phone_number, display_name } } })`
6. Database trigger `on_auth_user_created` creates:
   - `profiles` row (phone UNIQUE)
   - `wallets` row (0 ETB)
   - `user_bid_credits` row (0)

### Login
1. User enters Phone + Password
2. Same synthetic email reconstruction
3. `supabase.auth.signInWithPassword`

### Password Reset
- User messages admin on Telegram
- Admin uses Admin Dashboard → Reset Password (service-role `auth.admin.updateUserById`)

## Database Guarantees

```sql
-- profiles.phone_number is UNIQUE and CHECKED for Ethiopian mobile format
-- BEFORE INSERT trigger re-normalizes and rejects duplicates
```

## Security Notes

- Service role key lives only on the Replit server
- Frontend never sees service role key
- Rate limiting on auth endpoints in the Node backend
- Phone uniqueness cannot be bypassed by client

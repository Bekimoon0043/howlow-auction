# Admin Manual – HowLow

## Becoming Admin
Insert your user id into the `admins` table (see Deployment Guide).

## Daily Tasks

### Crediting Wallet
1. Admin → Wallet
2. Search by phone number
3. Enter amount → Add ETB
4. User is notified automatically

### Adding Bid Credits
Same screen → Adjust Credits (positive number).

### Creating Auctions
1. Admin → Products → add product (Amharic + English titles, retail price)
2. Admin → Auctions → select product, set duration & bid cost → Create & Publish

### Resolving Auctions Early
Admin → Auctions → “Resolve Now” (or wait for the automatic cron job).

### Settings
- Set the Telegram username that users will contact for deposits and password resets.

### Password Reset
User messages you on Telegram → use server endpoint or Supabase dashboard to set a new password.

## Security Notes
- Never share the service_role key.
- All balance changes go through Postgres functions and are audited in `transactions`.
- Bids remain hidden from other users until the auction status becomes `ended` or `no_winner`.

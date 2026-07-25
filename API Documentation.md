# API Documentation

Most data access goes through Supabase client + RLS.  
The Replit Node server exposes only privileged endpoints that require the service role.

## Supabase RPC (called from client)

### `place_bid(p_auction_id uuid, p_amount numeric)`
- Auth required
- Atomically deducts bid credits and inserts bid
- Returns `{ success: true, remaining_credits: n }` or raises exception

### `admin_adjust_wallet(p_target_user, p_amount, p_type, p_note?, p_deposit_request_id?)`
- Admin only (checked inside function)
- `p_type`: `admin_credit` | `admin_debit`
- Logs transaction + notifies user

### `admin_adjust_credits(p_target_user, p_credits, p_note?)`
- Admin only
- Can be positive or negative

### `resolve_auction(p_auction_id)`
- Computes Lowest Unique Bid, creates winner + order, notifies
- Called by pg_cron or manually by admin

## Server REST

### `GET /health`
Public health check.

### `POST /api/admin/reset-password`
Body: `{ phone, newPassword, adminUserId }`  
Uses service role to update Auth password. Rate limited.

## Realtime

Subscribe to:
- `notifications` filtered by `user_id = auth.uid()`
- `auctions` for status / countdown updates (public columns only)

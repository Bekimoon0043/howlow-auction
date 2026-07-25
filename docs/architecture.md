# HowLow – System Architecture

## High-Level Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│  React Client   │────▶│  Replit Node.js  │────▶│  Supabase           │
│  (Vite + TS)    │     │  Backend         │     │  - PostgreSQL       │
│  Tailwind PWA   │◀────│  (service role)  │◀────│  - Auth             │
│  Amharic/EN     │     │  Rate limiting   │     │  - Storage          │
└─────────────────┘     └──────────────────┘     │  - Realtime         │
                                                 │  - Edge (optional)  │
                                                 └─────────────────────┘
```

## Core Principles

1. **Phone is the only identity** the user ever sees.
2. **No payment gateway** – deposits & credit purchases go through Telegram admin.
3. **Bids are secret** until auction end. RLS + no realtime channel ever leaks other bids.
4. **All money movement is atomic** and audited via Postgres functions.
5. **Auction resolution is server-side only** (pg_cron + function).
6. **Admin power is enforced by RLS** (`admins` table), never by frontend role checks alone.
7. **Currency locked to ETB**.

## Module Boundaries

| Module | Responsibility |
|--------|----------------|
| Auth | Phone → synthetic email → Supabase Auth + profiles trigger |
| Wallet | Balance + transactions + deposit_requests |
| Bid Credits | Packages + user_bid_credits + atomic deduction |
| Auctions | Products, auctions lifecycle, countdowns |
| Bidding | Place bid (atomic), hide until end |
| LUB Engine | Count unique lowest bid, declare winner |
| Orders | Winner → shipping address → delivery status |
| Admin | Full CRUD + manual balance ops + stats |
| Notifications | In-app realtime |
| i18n | Amharic default + English |

## Data Flow – Place Bid

1. Client calls secure RPC `place_bid(auction_id, bid_amount)`
2. Function checks: auction active, user not banned, enough credits, no duplicate bid value
3. Deducts credits atomically, inserts bid row
4. Returns success only to the bidder

## Data Flow – Auction End

1. `pg_cron` job runs every minute
2. Finds auctions where `end_time <= now()` and `status = 'active'`
3. Calls `resolve_auction(auction_id)`
4. Function computes lowest unique bid, inserts into `winners`, creates order, notifies user, updates auction status

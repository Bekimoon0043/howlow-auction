# Database Schema Overview

## Core Tables

- **profiles** – id (auth.users), phone_number (UNIQUE E.164), display_name, banned, frozen, created_at
- **wallets** – user_id, balance (NUMERIC ETB), updated_at
- **user_bid_credits** – user_id, credits (INT)
- **transactions** – full audit (type, amount, balance_before/after, reference, created_by)
- **deposit_requests** – user claim log (amount, note, status)
- **bid_credit_packages** – name, credits, price_etb, active
- **categories** – name_am, name_en, slug
- **products** – title, description, retail_price, shipping_cost, images via product_images
- **auctions** – product_id, status, start/end, bid_cost, participant_count
- **bids** – auction_id, user_id, amount, created_at (hidden from others while active)
- **winners** – auction_id, user_id, winning_bid, savings
- **orders** – winner → shipping_address, status
- **shipping_addresses** – user addresses
- **notifications** – in-app
- **admins** – user_id (RLS gate)
- **settings** – key/value (admin_telegram_username, defaults…)
- **activity_logs** – admin actions

## Key Relationships

profiles 1──1 wallets  
profiles 1──1 user_bid_credits  
profiles 1──* bids  
auctions 1──* bids  
auctions 1──0..1 winners  
winners 1──1 orders  

## Critical Functions

- `place_bid(p_auction_id, p_amount)` – atomic credit deduction + insert
- `admin_adjust_wallet(...)` – atomic balance change + transaction log
- `resolve_auction(p_auction_id)` – LUB algorithm + winner + order
- `normalize_ethiopian_phone(text)` – helper

## RLS Strategy

Every table has RLS enabled.  
Admin checks: `EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())`  
Bids: users can only SELECT their own bids while auction is active.

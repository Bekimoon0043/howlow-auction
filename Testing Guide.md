# Testing Guide

## Auth
- [ ] Signup with valid +2519… number creates profile + wallet + credits
- [ ] Duplicate phone is rejected
- [ ] Login with phone + password works
- [ ] Invalid phone format is rejected

## Wallet & Deposits
- [ ] Deposit request appears for admin
- [ ] Admin credit updates balance and creates transaction + notification
- [ ] Telegram link opens correctly from settings value

## Bidding
- [ ] place_bid deducts correct credits
- [ ] Duplicate bid amount on same auction is rejected
- [ ] Insufficient credits is rejected
- [ ] Other users cannot see the bid while auction is active (RLS)

## LUB Engine
- [ ] Single unique lowest bid → that user wins
- [ ] No unique bids → status `no_winner`
- [ ] Winner notification created
- [ ] Order row created

## Admin
- [ ] Non-admin cannot call admin_adjust_wallet
- [ ] Ban flag prevents bidding
- [ ] Settings update is reflected in user UI

## i18n & UI
- [ ] Amharic is default
- [ ] Language switch persists
- [ ] Dark mode works
- [ ] Mobile bottom nav works

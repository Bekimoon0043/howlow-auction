# HowLow Auction Platform

**Production-ready Lowest Unique Bid Auction Platform** built specifically for the **Ethiopian market**.

- **Currency**: ETB (Ethiopian Birr) throughout
- **Auth**: Phone number only (`+2519XXXXXXXX` / `+2517XXXXXXXX`)
- **Deposits**: Manual Telegram admin flow (no payment gateway)
- **Stack**: React + Vite + TypeScript + Tailwind + Supabase + Replit Node.js backend
- **Languages**: Amharic-first + English

## Live Features

- Phone-only signup/login (synthetic email under the hood)
- Wallet + Bid Credits system
- Manual deposit requests + Telegram contact
- Secure secret bidding
- Automatic Lowest Unique Bid resolution (server-side)
- Full Admin Dashboard (products, auctions, users, wallet management, statistics)
- Realtime notifications & auction countdowns
- PWA, Dark/Light mode, mobile-first
- Referral, promo codes, categories, favorites, leaderboard (Phase 6 extras)

## Quick Start (Replit + Supabase)

1. Fork / import this repo into Replit
2. Create a Supabase project
3. Run all SQL migrations in `database/migrations/` in order
4. Set Replit Secrets (see `Environment Variables.md`)
5. `cd client && npm install && npm run dev`
6. `cd server && npm install && npm run dev`

See **Deployment Guide.md** for production deployment on Replit Deployments.

## Documentation

| Document | Description |
|----------|-------------|
| [Architecture](docs/architecture.md) | System design |
| [Auth Architecture](docs/auth-architecture.md) | Phone-only auth model |
| [Database Diagram](docs/database-diagram.md) | Schema overview |
| [API Documentation.md](API%20Documentation.md) | Endpoints |
| [Deployment Guide.md](Deployment%20Guide.md) | Replit + Supabase |
| [User Manual.md](User%20Manual.md) | End-user guide |
| [Admin Manual.md](Admin%20Manual.md) | Admin operations |
| [Environment Variables.md](Environment%20Variables.md) | Secrets |
| [Testing Guide.md](Testing%20Guide.md) | Test plan |

## License

Proprietary – built for commercial use in Ethiopia.

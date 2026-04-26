# Workline FX

Workline FX turns global stablecoin payouts into instant local-stablecoin settlement for verified humans — built as a World Mini App on World Chain.

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Home — balance, charts, incoming payout, gamification, activity preview |
| `/work` | Work agreements — active/completed, progress, milestones |
| `/settle` | Settlement flow — choose currency, view quote/rebate, confirm |
| `/settle/success` | Post-settlement success state with real result data |
| `/fx` | FX & liquidity — LP earnings, pool stats, rebate hook |
| `/account` | Wallet auth, World ID verification, preferred currency, stats |
| `/activity` | Full transaction history (merges mock + completed settlements) |

## Tech stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** — light theme, `#F4F5F9` / `#1B1F3B` / `#3B3FE7`
- **Framer Motion** — page transitions, micro-interactions
- **Satoshi** (via Fontshare) — typography
- **NextAuth v5** — Wallet Auth session management
- **World Mini App SDK** — MiniKit, IDKit, Wallet Auth, Pay scaffolding
- **Viem 2.x** — chain utilities

## How to run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Create `.env.local` with:

```env
NEXT_PUBLIC_APP_ID=app_xxx          # World Developer Portal app ID
RP_ID=rp_xxx                        # IDKit relying party ID
RP_SIGNING_KEY=xxx                   # IDKit signing key (hex)
AUTH_URL=https://your-tunnel.ngrok.io # Public URL for World App testing
NEXTAUTH_SECRET=xxx                  # NextAuth secret
NEXT_PUBLIC_WORKLINE_DEMO=1          # Enable demo mode (optional)
```

### World App testing

1. Expose local server with a tunnel: `ngrok http 3000` or similar
2. Set `AUTH_URL` to the tunnel URL in `.env.local`
3. Configure the tunnel URL as your Mini App URL in the World Developer Portal
4. Open the Mini App from World App

## What is demo / mock

| Area | Status |
|------|--------|
| UI and navigation | Fully built |
| Settlement flow (settle → API → success) | Wired via `POST /api/settle` — mock response, no on-chain execution |
| Activity updates after settlement | Client-side merge via localStorage |
| World ID verification | IDKit scaffold + demo toggle outside World App |
| Wallet Auth | Real MiniKit `walletAuth()` flow via NextAuth |
| Rebate logic | Gated by verified-human state; consistent across quote, settle, success |
| Pay / Send Transaction | Scaffold only (`src/lib/integrations/payments.ts`) |

## What is production TODO

- Replace `POST /api/settle` with on-chain settlement execution + server-side verification
- Persist World ID nullifier and verification state on backend
- Wire real contract addresses and token config for payouts
- Confirm Pay/Send Transaction results server-side before marking payouts complete
- Replace localStorage demo state with authenticated backend state

## World integration points

- **MiniKit:** `src/providers/index.tsx` (MiniKitProvider), `src/lib/integrations/minikit.ts`
- **Wallet Auth:** `src/auth/wallet/index.ts` → NextAuth credentials
- **IDKit / World ID:** `src/lib/integrations/world-id.ts`, `src/app/api/rp-signature/route.ts`, `src/app/api/verify-proof/route.ts`
- **Pay:** `src/lib/integrations/payments.ts` (scaffold)

## File structure (active surface)

```
src/app/              Route pages
src/components/minihub/  Primary component system
src/data/minihub.ts   Mock data
src/lib/minihub-types.ts  Types
src/lib/settlement-quote.ts  Shared settlement math
src/lib/demo-state.tsx  Client-side demo state (localStorage)
src/lib/integrations/  World SDK helpers
src/auth/             Wallet Auth + NextAuth
src/providers/        Client providers (MiniKit, Session, Demo)
```

Legacy/secondary code exists in `src/components/workline/` and template components — not active.

## See also

- [`HACKATHON_DEMO.md`](HACKATHON_DEMO.md) — pitch, demo flow, presentation notes
- [`PROJECT-STATUS.md`](PROJECT-STATUS.md) — detailed implementation status

# Workline FX — hackathon demo guide

## 30-second pitch

Workline FX turns global stablecoin payouts into instant local-stablecoin settlement for verified humans. Clients approve in **World Chat**, a verified worker chooses local stablecoin, **Workline AI** suggests a smart split, and the payout settles on World Chain — leaving behind a **verified income receipt** that builds a portable trust profile for credit.

## Demo flow (10 steps)

1. **Open Home** — show balance hero, earnings chart, digital card, gamification section
2. **See incoming payout ready** — the "Incoming payout ready" card with amount and CTA
3. **Tap "Choose settlement"** — navigate to `/settle`
4. **See the World Chat approval** — client message and approval timestamp surface as the settlement trigger
5. **Review Smart Split** — Workline AI proposes a 3-way allocation (local / stable / reserve); tap "Apply Smart Split"
6. **Choose settlement currency** — select wMXN, wBRL, wINR, or USDC; see live rate
7. **Review quote and rebate** — payout summary shows fee, rebate (only if verified human), and route
8. **Confirm settlement** — in World App: real USDC transfer; outside: mock API
9. **See success state** — settled amount, on-chain badge, **Verified Income Receipt** card, and **Credit line teaser**
10. **Check activity / account** — completed settlement appears in activity; account shows estimated credit line and trust score

### Optional demo extensions

- **Account** — show World ID verification state and the compact credit teaser
- **FX** — show LP earnings, pool APYs, rebate hook explanation
- **Work** — World Chat conversation with the client
- **Reset** — Account page has a "Reset" button in demo mode to replay the full flow

## What World primitives are used

| Primitive | Usage |
|-----------|-------|
| MiniKit | App detection, user state, launch context |
| Wallet Auth | Primary sign-in via `MiniKit.walletAuth()` → NextAuth session |
| World ID / IDKit | Identity verification scaffold; gated rebate logic for verified humans |
| Send Transaction | Real USDC / WLD transfer via `MiniKit.sendTransaction()` with userOp receipt polling |
| World Chat (XMTP) | Client → worker messaging and approval as a settlement trigger |
| AI Suggestion | Rule-based Smart Split allocation on the settle page |

## What is built

- Complete 5-tab mobile UI (Home, Work, Settle, FX, Account)
- End-to-end settlement flow: World Chat approval → Smart Split → choose currency → settle → receipt + credit teaser
- Shared settlement math (fee 0.15%, rebate 0.08% for verified humans)
- Client-side state persistence (localStorage) for settlements, verification, preferences
- Activity page merges completed settlements with mock history
- Account with World ID verification toggle, preferred currency, settlement stats, and credit teaser
- Framer Motion animations throughout

## What is real (on-chain)

- USDC / WLD settlement: real `MiniKit.sendTransaction()` on World Chain
- Transaction hashes are real and viewable on worldscan.org
- Wallet Auth: real SIWE authentication flow via MiniKit
- World Chat: real end-to-end encrypted messaging via XMTP v3 (MLS)

## What is mocked

- `POST /api/settle` is the web-only fallback (outside World App) with deterministic txHash
- Settlement state is persisted in localStorage, not a database
- World ID verification outside World App is a demo toggle
- World Chat approvals are seeded (mock messages tied to ready payouts) so the flow always demos cleanly
- Verified Income Receipts and Credit Line Teaser values are derived locally from settlement history
- Mock data for balances, agreements, pools, charts
- AI Smart Split uses a rule-based heuristic, not a real ML model

## Developer Portal setup

Before real transactions work, allowlist in Developer Portal > Permissions:
- **Permit2 Tokens**: USDC `0x79A02482A880bCE3F13e09Da970dC34db4CD24d1`
- **Contract Entrypoints**: USDC `0x79A02482A880bCE3F13e09Da970dC34db4CD24d1` (transfer)

## What comes next

- Server-side verification of settlement results before confirming payouts
- Backend persistence of World ID nullifiers, receipts, and trust profile
- Real LP pool integration and dynamic FX rate feeds
- Real AI model for Smart Split suggestions (currently rule-based heuristic)
- Real credit underwriting based on receipt history (currently a teaser)

## Environment setup for demo

```bash
npm install
NEXT_PUBLIC_WORKLINE_DEMO=1 npm run dev
```

Demo mode defaults the user to "verified human" so the rebate flow works without World App. Set `NEXT_PUBLIC_WORKLINE_DEMO=1` in `.env.local` for persistent demo mode.

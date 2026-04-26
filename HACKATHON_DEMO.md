# Workline FX — hackathon demo guide

## 30-second pitch

Workline FX turns global stablecoin payouts into instant local-stablecoin settlement for verified humans. A business can send a payout in stablecoins, the recipient chooses the local stablecoin they actually use, and verified humans unlock better FX economics through rebate routing inside a World Mini App.

## Demo flow (10 steps)

1. **Open Home** — show balance hero, earnings chart, digital card, gamification section
2. **See incoming payout ready** — the "Incoming payout ready" card with amount and CTA
3. **Tap "Choose settlement"** — navigate to `/settle`
4. **See AI suggestion** — "Workline AI" banner recommends how much to convert vs. keep in stables
5. **Choose local stablecoin** — select wMXN, wBRL, wINR, or USDC; see live rate
6. **Review quote and rebate** — payout summary shows fee, rebate (only if verified human), and route
7. **Confirm settlement** — in World App: real USDC transfer or DNA Swap deep-link; outside: mock API
8. **See success state** — real received amount, rebate if eligible, clickable explorer link for on-chain tx
9. **Check activity** — completed settlement appears at top of activity list; home card updates
10. **Show explorer** — tap tx hash link to open worldscan.org and see the real on-chain transaction

### Optional demo extensions

- **Account** — show World ID verification state; tap "Verify with World ID" to toggle
- **FX** — show LP earnings, pool APYs, rebate hook explanation
- **Work** — show active agreements with progress bars
- **Reset** — Account page has a "Reset" button in demo mode to replay the full flow

## What World primitives are used

| Primitive | Usage |
|-----------|-------|
| MiniKit | App detection, user state (`verificationStatus`, `preferredCurrency`), launch context |
| Wallet Auth | Primary sign-in via `MiniKit.walletAuth()` → NextAuth session |
| IDKit / World ID | Identity verification scaffold; gated rebate logic for verified humans |
| Pay | Scaffold ready (`src/lib/integrations/payments.ts`); not executed in demo |
| Send Transaction | Real USDC transfer via `MiniKit.sendTransaction()` with userOp receipt polling |
| DNA Swap QA | Deep-link to World App native swap for FX currency conversions |
| AI Suggestion | Rule-based smart split recommendation on settle page |

## What is built

- Complete 5-tab mobile UI (Home, Work, Settle, FX, Account)
- End-to-end settlement flow: choose currency → API call → success with real data
- Shared settlement math (fee 0.15%, rebate 0.08% for verified humans)
- Client-side state persistence (localStorage) for settlements, verification, preferences
- Activity page merges completed settlements with mock history
- Account with World ID verification toggle, preferred currency, settlement stats
- RebateBadge and quote row semantics gated by verification state
- Framer Motion animations throughout

## What is real (on-chain)

- USDC settlement: real `MiniKit.sendTransaction()` calling USDC `transfer()` on World Chain
- FX swap: real Uniswap swap via DNA Swap Quick Action deep-link (native World App UI)
- Transaction hashes are real and viewable on worldscan.org
- Wallet Auth: real SIWE authentication flow via MiniKit

## What is mocked

- `POST /api/settle` is the web-only fallback (outside World App) with deterministic txHash
- Settlement state is persisted in localStorage, not a database
- World ID verification outside World App is a demo toggle
- Mock data for balances, agreements, pools, charts
- AI suggestion uses a rule-based heuristic, not a real ML model

## Developer Portal setup

Before real transactions work, allowlist in Developer Portal > Permissions:
- **Permit2 Tokens**: USDC `0x79A02482A880bCE3F13e09Da970dC34db4CD24d1`
- **Contract Entrypoints**: USDC `0x79A02482A880bCE3F13e09Da970dC34db4CD24d1` (transfer)

## What comes next

- Server-side verification of settlement results before confirming payouts
- Backend persistence of World ID nullifiers and user state
- Real LP pool integration and dynamic FX rate feeds
- Real AI model for smart split suggestions (currently rule-based heuristic)
- Production security audit for all backend verification paths

## Environment setup for demo

```bash
npm install
NEXT_PUBLIC_WORKLINE_DEMO=1 npm run dev
```

Demo mode defaults the user to "verified human" so the rebate flow works without World App. Set `NEXT_PUBLIC_WORKLINE_DEMO=1` in `.env.local` for persistent demo mode.

# Workline FX - project status

Last updated: April 26, 2026

This document summarizes what is **built and shippable today**, what **exists in the repo but is secondary/legacy**, and what is **not wired to production** yet.

---

## Product in one line

**Workline FX** is a World Mini App-style experience for stablecoin **payout and settlement** UX: show balances, incoming payouts, choose a local stablecoin, see quotes/rebates, and complete a settlement flow. The **primary UI** is **mock-data driven** and optimized for demo quality; on-chain execution is not the focus of the current front end.

---

## Tech stack

| Area | Stack |
|------|--------|
| Framework | Next.js 15 (App Router), TypeScript, React 19 |
| Styling | Tailwind CSS v4, global tokens in `src/app/globals.css` |
| Motion | Framer Motion (`^11.18.2`) on key screens |
| Auth | NextAuth v5 (beta), wallet auth in `src/auth/wallet/` |
| World / Mini | MiniKit, Minikit React, IDKit, `@worldcoin/mini-apps-ui-kit-react` |
| Chain utilities | Viem 2.x |
| Font | Satoshi (via Fontshare) in `src/app/layout.tsx` |

---

## What is ready (main product UI)

The **active app surface** lives under `src/components/minihub/` and `src/app/` routes that use `AppShell` with the **light finance theme** (off-white background `#F4F5F9`, navy text `#1B1F3B`, indigo accent `#3B3FE7`).

### Core shell

- `AppShell`, `TopBar`, `BottomNav` - 5 tabs: **Home**, **Work**, **Settle**, **FX**, **Account**

### Screens (implemented)

| Route | Purpose |
|-------|---------|
| `/` | Home: hero balance, charts, incoming payout CTA, gamification, activity preview |
| `/work` | Work agreements: active / completed tabs, progress bars |
| `/settle` | Settlement flow: amount, currency selection, quote/rebate, API call, confirm |
| `/settle/success` | Post-settlement success with real result data |
| `/fx` | LP earnings card, active pools, rebate hook blurb |
| `/account` | Wallet auth, World ID verification, preferred currency, stats |
| `/activity` | Full activity list (merges completed settlements with mock history) |

### Shared components (minihub)

`BalanceHero`, `EarningsChart`, `DigitalCard`, `GamificationSection`, `PayoutMix`, `IncomingPayoutCard`, `ActivityList`, `SettlementQuoteCard`, `CurrencySelector`, `AccountPanel`, `RebateBadge`, `StatusChip`, and related small UI.

### Data layer

- **Mock data:** `src/data/minihub.ts`
- **Types:** `src/lib/minihub-types.ts`
- **Settlement math:** `src/lib/settlement-quote.ts` (shared between client and API)
- **Demo state:** `src/lib/demo-state.tsx` (localStorage-backed, verification, preferences, completed settlements)

---

## Hackathon hardening (April 26, 2026)

Added to make the app demo-ready:

- **`src/lib/settlement-quote.ts`** - shared settlement math used by client and `POST /api/settle`.
- **`POST /api/settle`** - mock settlement endpoint with deterministic txHash.
- **`src/lib/demo-state.tsx`** - client-side state (localStorage) for verification, preferences, settlements.
- **Settle flow** - `/settle` calls API, passes result to `/settle/success` via demo state.
- **Activity merge** - completed settlements merged into activity and home pages.
- **Account panel** - World ID toggle, preferred currency, stats, demo mode indicator.
- **RebateBadge / SettlementQuoteCard** - gated by `verifiedHuman` state.
- **`HACKATHON_DEMO.md`** - pitch, demo flow, presentation notes.

---

## Redirects and legacy routes

- `/payout` -> `/settle`
- `/payout/success` -> `/settle/success`
- `/more`, `/features` -> `/account`
- `/dashboard`, `/home`, `/milestones`, etc. may still be present from earlier scaffolding.

---

## World / backend scaffolding

- MiniKit / providers: `src/providers/`
- Wallet auth: `src/auth/wallet/`
- API routes: `src/app/api/auth/[...nextauth]/`, `src/app/api/verify-proof/`, `src/app/api/rp-signature/`, `src/app/api/settle/`
- Integration helpers: `src/lib/integrations/minikit.ts`, `world-id.ts`, `payments.ts`
- `src/abi/TestContract.json` - ABI for future contract work

---

## Other code in the repo (secondary)

- `src/components/workline/` - alternate component set; not the primary `minihub` shell.
- `src/components/{AuthButton,PageLayout,Navigation,Verify,Pay,Transaction,...}` - template samples.
- `src/app/(protected)/` - example protected layout with old navigation.

Default to **`minihub` + `src/data/minihub.ts`** for active work.

---

## On-chain transactions (April 26, 2026)

Added real on-chain capability inside World App:

- **`src/lib/onchain.ts`** - USDC transfer via `MiniKit.sendTransaction()`, userOp receipt polling, DNA Swap deep-link builder, explorer URL helper.
- **Two-path settle flow** - in World App: real USDC transfer (self-transfer) for USDC payouts, DNA Swap deep-link for FX conversions (wMXN, wBRL, etc.). Outside World App: existing mock API fallback.
- **`src/lib/ai-suggestion.ts`** + `AiSuggestionBanner` - rule-based AI recommendation on settle page suggesting how much to convert to local currency vs. keep in stables.
- **Success page** - clickable explorer links for real on-chain transactions, userOp hash display, deep-link return handling.
- **Types extended** - `SettleResponse` now has optional `userOpHash`, `onchain`, `explorerUrl`. New `PendingSettlement` type for deep-link return flow.
- **Demo state** - added `pendingSettlement` for cross-app deep-link return.

### Developer Portal setup required

Before real transactions work in World App, allowlist in Developer Portal > Permissions:
- **Permit2 Tokens**: USDC `0x79A02482A880bCE3F13e09Da970dC34db4CD24d1`
- **Contract Entrypoints**: USDC `0x79A02482A880bCE3F13e09Da970dC34db4CD24d1` (transfer)

---

## Remaining production work

- [x] On-chain settlement execution via Send Transaction
- [ ] Server-side verification of settlement results
- [ ] Backend persistence of World ID nullifiers
- [ ] Real FX rate feeds and LP pool integration
- [ ] Real AI model for smart split suggestions (currently rule-based)
- [ ] Security audit for backend verification paths

---

*This is a project snapshot, not a legal or compliance statement. Adjust before external distribution.*

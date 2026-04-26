#!/usr/bin/env bash
# Deploy the Workline FX stack to World Chain mainnet (chain id 480).
# Requires: foundry installed, .env.local at project root with
# DEPLOYER_PRIVATE_KEY set, deployer address funded with at least
# ~0.0005 WLD (in practice we send 0.05 WLD as a safety buffer).

set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env.local ]; then
  echo "ERROR: .env.local not found. Run scripts/gen-deployer.mjs first."
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env.local
set +a

if [ -z "${DEPLOYER_PRIVATE_KEY:-}" ]; then
  echo "ERROR: DEPLOYER_PRIVATE_KEY missing in .env.local"
  exit 1
fi

export PATH="$HOME/.foundry/bin:$PATH"
export WORLDCHAIN_RPC_URL="${NEXT_PUBLIC_WORLDCHAIN_RPC:-https://worldchain-mainnet.g.alchemy.com/public}"

cd contracts

echo "=========================================="
echo "Deployer: ${DEPLOYER_ADDRESS:-unknown}"
echo "RPC:      ${WORLDCHAIN_RPC_URL}"
echo "Chain:    World Chain mainnet (480)"
echo "=========================================="
echo

# 1) Re-simulate to make sure addresses still match nonce 0.
echo "[1/3] Simulating deploy (no broadcast)…"
forge script script/Deploy.s.sol:Deploy \
  --rpc-url worldchain \
  --sender "${DEPLOYER_ADDRESS}" \
  | tail -25
echo

# 2) Broadcast for real.
echo "[2/3] Broadcasting to World Chain mainnet…"
forge script script/Deploy.s.sol:Deploy \
  --rpc-url worldchain \
  --broadcast \
  --slow \
  --sender "${DEPLOYER_ADDRESS}" \
  | tail -40
echo

# 3) Print final summary from the broadcast artifact.
ART="broadcast/Deploy.s.sol/480/run-latest.json"
if [ -f "$ART" ]; then
  echo "[3/3] Broadcast summary:"
  node -e '
    const fs = require("fs");
    const j = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
    const txs = j.transactions || [];
    const created = txs.filter(t => t.transactionType === "CREATE");
    console.log("  Contracts deployed:");
    for (const c of created) {
      console.log(`    - ${c.contractName.padEnd(18)} ${c.contractAddress}`);
    }
    console.log("  Total tx count:", txs.length);
  ' "$ART"
fi
echo
echo "Done. Update .env.local NEXT_PUBLIC_FX_* if any address differs from the predicted set."

#!/usr/bin/env node
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

const ROOT = resolve(process.cwd());
const ENV_PATH = resolve(ROOT, ".env.local");

const KEY = "DEPLOYER_PRIVATE_KEY";
const ADDR_KEY = "DEPLOYER_ADDRESS";

const existing = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";
const hasKey = new RegExp(`^${KEY}=`, "m").test(existing);

if (hasKey && !process.argv.includes("--force")) {
  const match = existing.match(new RegExp(`^${ADDR_KEY}=(.*)$`, "m"));
  const addr = match ? match[1].replace(/['"]/g, "").trim() : "(unknown)";
  console.log(`\nDeployer wallet already exists in .env.local`);
  console.log(`Address: ${addr}`);
  console.log(`\nRe-run with --force to overwrite (DANGEROUS).`);
  process.exit(0);
}

const pk = generatePrivateKey();
const account = privateKeyToAccount(pk);

let next = existing.replace(new RegExp(`^${KEY}=.*$`, "m"), "").replace(new RegExp(`^${ADDR_KEY}=.*$`, "m"), "").trim();
if (next.length > 0) next += "\n";
next += `\n# === Workline FX deployer wallet (DO NOT COMMIT) ===\n`;
next += `${KEY}='${pk}'\n`;
next += `${ADDR_KEY}='${account.address}'\n`;

mkdirSync(dirname(ENV_PATH), { recursive: true });
writeFileSync(ENV_PATH, next, { mode: 0o600 });

console.log(`\nGenerated fresh deployer wallet`);
console.log(`Public address: ${account.address}`);
console.log(`Private key written to: ${ENV_PATH} (chmod 600)`);
console.log(`\nNEXT: fund this address with mainnet WLD on World Chain (chainId 480).`);
console.log(`Recommended: ~0.5 WLD covers 3 contract deploys + seed liquidity + buffer.`);

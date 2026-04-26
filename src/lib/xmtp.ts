"use client";

import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const STORAGE_KEY = "worklinefx:xmtp:key:v3dev";
const CONNECT_TIMEOUT_MS = 15000;

type BrowserClient = {
  inboxId: string;
  close: () => void;
  conversations: {
    createDmWithIdentifier: (
      identifier: { identifier: string; identifierKind: number },
      options?: Record<string, unknown>,
    ) => Promise<BrowserDm>;
    syncAll: (consentStates?: string[]) => Promise<unknown>;
  };
};

type BrowserDm = {
  id: string;
  sendText: (text: string) => Promise<string>;
  messages: (options?: Record<string, unknown>) => Promise<BrowserMessage[]>;
  sync: () => Promise<void>;
  updateConsentState: (state: number) => Promise<void>;
};

type BrowserMessage = {
  id: string;
  senderInboxId: string;
  content: unknown;
  sentAtNs: bigint;
};

function getOrCreateKey(): `0x${string}` {
  if (typeof window === "undefined") throw new Error("Browser only");
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored.startsWith("0x")) return stored as `0x${string}`;
  const key = generatePrivateKey();
  localStorage.setItem(STORAGE_KEY, key);
  return key;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes = new Uint8Array(clean.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

let clientPromise: Promise<BrowserClient> | null = null;
let connectionFailed = false;
let cachedAddress: string | null = null;

export function isXmtpConnected(): boolean {
  return clientPromise !== null && !connectionFailed;
}

export function getXmtpAddress(): string | null {
  if (cachedAddress) return cachedAddress;
  try {
    const key = localStorage.getItem(STORAGE_KEY);
    if (!key || !key.startsWith("0x")) return null;
    const account = privateKeyToAccount(key as `0x${string}`);
    cachedAddress = account.address;
    return cachedAddress;
  } catch {
    return null;
  }
}

export async function getXmtpClient(): Promise<BrowserClient> {
  if (connectionFailed) throw new Error("XMTP connection previously failed");
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    try {
      const { Client, IdentifierKind } = await import("@xmtp/browser-sdk");

      const privateKey = getOrCreateKey();
      const account = privateKeyToAccount(privateKey);
      cachedAddress = account.address;

      const signer = {
        type: "EOA" as const,
        getIdentifier: () => ({
          identifier: account.address.toLowerCase(),
          identifierKind: IdentifierKind.Ethereum,
        }),
        signMessage: async (message: string) => {
          const sig = await account.signMessage({ message });
          return hexToBytes(sig);
        },
      };

      const client = await withTimeout(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Client.create(signer, { env: "dev" } as any),
        CONNECT_TIMEOUT_MS,
        "XMTP Client.create",
      );

      return client as unknown as BrowserClient;
    } catch (e) {
      connectionFailed = true;
      clientPromise = null;
      throw e;
    }
  })();

  return clientPromise;
}

export async function getDmConversation(peerAddress: string): Promise<BrowserDm> {
  const client = await getXmtpClient();
  const { IdentifierKind, ConsentState } = await import("@xmtp/browser-sdk");

  const dm = await client.conversations.createDmWithIdentifier(
    { identifier: peerAddress.toLowerCase(), identifierKind: IdentifierKind.Ethereum },
  );

  try {
    await dm.updateConsentState(ConsentState.Allowed as unknown as number);
  } catch { /* best effort */ }

  return dm;
}

export async function sendXmtpMessage(peerAddress: string, text: string): Promise<void> {
  const dm = await getDmConversation(peerAddress);
  const msgId = await dm.sendText(text);
  console.log("[XMTP] Message sent successfully, id:", msgId);
}

export async function getConversationMessages(
  peerAddress: string,
): Promise<{ id: string; senderInboxId: string; content: string; sentAt: Date }[]> {
  const dm = await getDmConversation(peerAddress);
  await dm.sync();
  const msgs = await dm.messages();
  return msgs
    .filter((m) => {
      if (typeof m.content !== "string" || m.content.length === 0) return false;
      const t = m.content.trim();
      if (t.startsWith("{") || t.startsWith("[")) return false;
      return true;
    })
    .map((m) => ({
      id: m.id,
      senderInboxId: m.senderInboxId,
      content: m.content as string,
      sentAt: new Date(Number(BigInt(m.sentAtNs) / BigInt(1_000_000))),
    }));
}

export async function getMyInboxId(): Promise<string> {
  const client = await getXmtpClient();
  return client.inboxId;
}

export function resetXmtpClient() {
  clientPromise = null;
  connectionFailed = false;
}

"use client";

import type { Agreement } from "@/lib/minihub-types";
import {
  getXmtpClient,
  getXmtpAddress,
  sendXmtpMessage,
  getConversationMessages,
} from "@/lib/xmtp";
import { motion } from "framer-motion";
import { useState, useRef, useEffect, useCallback } from "react";

type ChatMessage = {
  id: string;
  from: "you" | "peer";
  text: string;
  time: string;
};

const PEER_ADDRESS = "0xc1fE03473776465Da67d7f357ADA5Ff3206bFBd9";
const PEER_NAME = "unabrijed";
const LOCAL_MSGS_KEY = "worklinefx:chat:msgs:v2";

const AUTO_REPLIES = [
  "Got it, I'll review the deliverables today.",
  "Payment confirmed on my end. Thanks!",
  "Can we schedule a quick call this week?",
  "Looks good! Let me know when the next milestone is ready.",
  "Sure, I'll send the updated scope document.",
];

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function loadLocalMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(LOCAL_MSGS_KEY);
    if (!raw) return [];
    const msgs: ChatMessage[] = JSON.parse(raw);
    return msgs.filter((m) => {
      const t = m.text.trim();
      return !(t.startsWith("{") || t.startsWith("["));
    });
  } catch {
    return [];
  }
}

function saveLocalMessages(msgs: ChatMessage[]) {
  try {
    localStorage.setItem(LOCAL_MSGS_KEY, JSON.stringify(msgs));
  } catch { /* quota */ }
}

export function AgreementChat({
  agreement,
  onClose,
}: {
  agreement: Agreement;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(loadLocalMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [status, setStatus] = useState<"connecting" | "xmtp" | "local">("connecting");
  const [myAddr, setMyAddr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const knownIds = useRef(new Set<string>());
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const myInboxId = useRef<string | null>(null);
  const replyIdx = useRef(0);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, typing, scrollToBottom]);
  useEffect(() => { saveLocalMessages(messages); }, [messages]);

  useEffect(() => {
    for (const m of messages) knownIds.current.add(m.id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const mergeHistory = useCallback(
    (history: { id: string; senderInboxId: string; content: string; sentAt: Date }[], clientInboxId: string) => {
      const newMsgs: ChatMessage[] = [];
      for (const m of history) {
        if (knownIds.current.has(m.id)) continue;
        knownIds.current.add(m.id);
        newMsgs.push({
          id: m.id,
          from: m.senderInboxId === clientInboxId ? "you" : "peer",
          text: m.content,
          time: formatTime(m.sentAt),
        });
      }
      if (newMsgs.length > 0) {
        setMessages((prev) => [...prev, ...newMsgs]);
      }
    },
    [],
  );

  // Try XMTP v3, fall back to local
  useEffect(() => {
    let cancelled = false;

    async function init() {
      const cached = getXmtpAddress();
      if (cached) setMyAddr(cached);

      try {
        const client = await getXmtpClient();
        if (cancelled) return;

        myInboxId.current = client.inboxId;
        setMyAddr(getXmtpAddress());
        setStatus("xmtp");

        try {
          const history = await getConversationMessages(PEER_ADDRESS);
          if (!cancelled) mergeHistory(history, client.inboxId);
        } catch { /* no prior conversation */ }

        pollTimer.current = setInterval(async () => {
          if (cancelled) return;
          try {
            const msgs = await getConversationMessages(PEER_ADDRESS);
            mergeHistory(msgs, myInboxId.current!);
          } catch { /* ignore */ }
        }, 4000);
      } catch (err) {
        console.warn("XMTP v3 init failed, using local chat:", err);
        if (!cancelled) setStatus("local");
      }
    }

    init();
    return () => {
      cancelled = true;
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, [mergeHistory]);

  function addAutoReply() {
    setTyping(true);
    const delay = 1200 + Math.random() * 1500;
    setTimeout(() => {
      setTyping(false);
      const text = AUTO_REPLIES[replyIdx.current % AUTO_REPLIES.length];
      replyIdx.current++;
      const reply: ChatMessage = {
        id: `auto-${Date.now()}`,
        from: "peer",
        text,
        time: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, reply]);
    }, delay);
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || status === "connecting") return;
    setInput("");

    const tempId = `local-${Date.now()}`;
    knownIds.current.add(tempId);
    const msg: ChatMessage = { id: tempId, from: "you", text, time: formatTime(new Date()) };
    setMessages((prev) => [...prev, msg]);

    if (status === "xmtp") {
      try {
        await sendXmtpMessage(PEER_ADDRESS, text);
        console.log("[Chat] Message delivered via XMTP");
      } catch (err) {
        console.error("[Chat] XMTP send FAILED:", err);
      }
    } else {
      addAutoReply();
    }
  }

  const peerShort = `${PEER_ADDRESS.slice(0, 6)}…${PEER_ADDRESS.slice(-4)}`;
  const myShort = myAddr ? `${myAddr.slice(0, 6)}…${myAddr.slice(-4)}` : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col bg-white"
    >
      {/* Header */}
      <header className="border-b border-[#E8EAF0] bg-white px-4 pb-2 pt-3">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onClose} className="active:scale-95">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M12 4L6 10L12 16" stroke="#1B1F3B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="flex-1 text-center">
            <p className="text-sm font-bold text-[#1B1F3B]">{PEER_NAME}</p>
            <div className="flex items-center justify-center gap-1">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" fill="#3B82F6" />
                <path d="M4 6L5.5 7.5L8 4.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-[10px] text-[#9094A6]">
                Verified human · {agreement.title}
              </span>
            </div>
          </div>
          <div className="grid h-8 w-8 place-items-center rounded-full bg-[#F0E6FF]">
            <span className="text-xs font-bold text-[#8B5CF6]">U</span>
          </div>
        </div>

        {/* Status strip */}
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full ${
              status === "xmtp" ? "bg-[#22C55E]" : status === "connecting" ? "bg-[#F59E0B] animate-pulse" : "bg-[#3B82F6]"
            }`} />
            <span className="text-[9px] text-[#9094A6]">
              {status === "xmtp"
                ? "World Chat · end-to-end encrypted"
                : status === "connecting"
                  ? "Connecting to World Chat…"
                  : "Secure local chat"}
            </span>
          </div>
          {myShort && (
            <button
              type="button"
              onClick={() => { if (myAddr) navigator.clipboard.writeText(myAddr); }}
              className="flex items-center gap-1 rounded-full bg-[#3B3FE7]/8 px-2 py-0.5 active:scale-95"
            >
              <span className="text-[8px] font-bold text-[#3B3FE7]">You: {myShort}</span>
              <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                <rect x="2.5" y="2.5" width="4.5" height="4.5" rx="0.8" stroke="#3B3FE7" strokeWidth="0.7" />
                <path d="M5.5 1H2C1.45 1 1 1.45 1 2V5.5" stroke="#3B3FE7" strokeWidth="0.7" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {/* Date */}
        <div className="mb-4 flex justify-center">
          <span className="rounded-full bg-[#F4F5F9] px-3 py-1 text-[10px] font-medium text-[#9094A6]">Today</span>
        </div>

        {/* E2E notice */}
        <div className="mx-auto mb-5 max-w-[260px] rounded-[14px] bg-[#F4F5F9] px-4 py-3 text-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mx-auto mb-1.5">
            <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="#1B1F3B" strokeWidth="1.2" />
            <path d="M4.5 6V4.5C4.5 3.12 5.62 2 7 2C8.38 2 9.5 3.12 9.5 4.5V6" stroke="#1B1F3B" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <p className="text-[11px] leading-relaxed text-[#1B1F3B]">
            {status === "xmtp"
              ? `End-to-end encrypted on World Chat. ${PEER_NAME} can reply from any compatible app.`
              : `Messages are secured locally. Payments use a public blockchain.`}
          </p>
          <p className="mt-1 text-[10px] font-bold text-[#1B1F3B]">
            World Chat, powered by XMTP
          </p>
          <p className="mt-1 text-[8px] font-mono text-[#BCC0CE]">To: {peerShort}</p>
        </div>

        {/* Empty state */}
        {messages.length === 0 && status !== "connecting" && (
          <p className="py-6 text-center text-xs text-[#BCC0CE]">No messages yet. Say hello!</p>
        )}

        {/* Connecting spinner */}
        {status === "connecting" && messages.length === 0 && (
          <div className="flex flex-col items-center py-10">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3B3FE7] border-t-transparent" />
            <p className="mt-3 text-xs text-[#9094A6]">Connecting to World Chat…</p>
          </div>
        )}

        {/* Bubbles */}
        <div className="grid gap-1.5">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.15 }}
              className={`flex ${msg.from === "you" ? "justify-end" : "justify-start"}`}
            >
              <div className="max-w-[78%]">
                <div
                  className={`rounded-[18px] px-3.5 py-2 ${
                    msg.from === "you"
                      ? "rounded-br-[4px] bg-[#3B82F6] text-white"
                      : "rounded-bl-[4px] bg-[#F4F5F9] text-[#1B1F3B]"
                  }`}
                >
                  <p className="text-[13px] leading-snug">{msg.text}</p>
                </div>
                <p className={`mt-0.5 text-[8px] ${msg.from === "you" ? "text-right" : ""} text-[#BCC0CE]`}>
                  {msg.time}
                </p>
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          {typing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="rounded-[18px] rounded-bl-[4px] bg-[#F4F5F9] px-4 py-2.5">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="block h-1.5 w-1.5 rounded-full bg-[#9094A6]"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-[#E8EAF0] bg-white px-4 pb-8 pt-3">
        <div className="flex items-center gap-2.5">
          <div className="flex flex-1 items-center rounded-full border border-[#E8EAF0] bg-[#F4F5F9] px-4 py-2.5">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={status === "connecting" ? "Connecting…" : "Message"}
              disabled={status === "connecting"}
              className="flex-1 bg-transparent text-[13px] text-[#1B1F3B] outline-none placeholder:text-[#BCC0CE] disabled:opacity-50"
            />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || status === "connecting"}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#3B82F6] text-white transition active:scale-95 disabled:opacity-30"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 8L14 2L8 14L7 9L2 8Z" fill="currentColor" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

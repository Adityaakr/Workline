import type { MinihubTab } from "@/lib/minihub-types";
import Link from "next/link";

const tabs: Array<{ href: string; label: string; tab: MinihubTab }> = [
  { href: "/", label: "Home", tab: "home" },
  { href: "/work", label: "Work", tab: "work" },
  { href: "/settle", label: "Settle", tab: "settle" },
  { href: "/fx", label: "FX", tab: "fx" },
  { href: "/account", label: "Account", tab: "account" },
];

function Icon({ tab, active }: { tab: MinihubTab; active: boolean }) {
  const c = active ? "#1B1F3B" : "#9094A6";
  switch (tab) {
    case "home": return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 7.5L10 2L17 7.5V16C17 16.6 16.6 17 16 17H4C3.4 17 3 16.6 3 16V7.5Z" stroke={c} strokeWidth="1.5" /><path d="M7 17V11H13V17" stroke={c} strokeWidth="1.5" /></svg>;
    case "work": return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="4" y="2" width="12" height="16" rx="2" stroke={c} strokeWidth="1.5" /><line x1="7" y1="6" x2="13" y2="6" stroke={c} strokeWidth="1.2" strokeLinecap="round" /><line x1="7" y1="9.5" x2="13" y2="9.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" /><line x1="7" y1="13" x2="10" y2="13" stroke={c} strokeWidth="1.2" strokeLinecap="round" /></svg>;
    case "settle": return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7.5" stroke={c} strokeWidth="1.5" /><path d="M10 5.5V14.5M7.5 8H12.5C13.3 8 14 8.7 14 9.5C14 10.3 13.3 11 12.5 11H7.5H13C13.8 11 14.5 11.7 14.5 12.5C14.5 13.3 13.8 14 13 14H7.5" stroke={c} strokeWidth="1.2" strokeLinecap="round" /></svg>;
    case "fx": return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M4 7H16M16 7L13 4M16 7L13 10" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M16 13H4M4 13L7 10M4 13L7 16" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>;
    case "account": return <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="7" r="3.5" stroke={c} strokeWidth="1.5" /><path d="M3 17C3 14 6 12 10 12C14 12 17 14 17 17" stroke={c} strokeWidth="1.5" strokeLinecap="round" /></svg>;
  }
}

export function BottomNav({ active }: { active: MinihubTab }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E8EAF0] bg-white/95 backdrop-blur-lg">
      <div className="mx-auto grid max-w-[430px] grid-cols-5">
        {tabs.map((t) => {
          const on = active === t.tab;
          return (
            <Link key={t.href} href={t.href} className="relative flex flex-col items-center gap-1 py-2.5 active:scale-95">
              {on && <span className="absolute top-0 left-1/2 h-[3px] w-5 -translate-x-1/2 rounded-full bg-[#1B1F3B]" />}
              <Icon tab={t.tab} active={on} />
              <span className={`text-[10px] font-semibold ${on ? "text-[#1B1F3B]" : "text-[#9094A6]"}`}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

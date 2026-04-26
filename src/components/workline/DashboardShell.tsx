import type { ReactNode } from "react";

type DashboardShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  aside?: ReactNode;
};

export function DashboardShell({
  title,
  description,
  children,
  aside,
}: DashboardShellProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="rounded-2xl bg-[#222831] p-6 text-[#EEEEEE] shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#00ADB5]">
          Workline FX
        </p>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#EEEEEE]/72">
          {description}
        </p>
        <div className="mt-6">{children}</div>
      </div>
      {aside ? <aside className="grid gap-4">{aside}</aside> : null}
    </section>
  );
}

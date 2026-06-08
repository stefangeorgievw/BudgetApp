import Link from "next/link";
import { ReactNode } from "react";

const navigation = [
  { href: "/", label: "Dashboard", accent: "Balance" },
  { href: "/income", label: "Income", accent: "Cash in" },
  { href: "/expenses", label: "Expenses", accent: "Cash out" },
  { href: "/reports/monthly", label: "Monthly report", accent: "Month view" },
  { href: "/reports/daily", label: "Daily report", accent: "Day view" },
];

type AppShellProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function AppShell({ title, description, children }: AppShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--canvas)] text-[var(--ink)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.85),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(22,163,74,0.12),_transparent_30%),linear-gradient(135deg,_#f5efe3_0%,_#f8f6f1_45%,_#d9efe3_100%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:flex-row lg:px-8">
        <aside className="w-full rounded-[2rem] border border-white/60 bg-white/75 p-5 shadow-[0_30px_80px_rgba(35,38,45,0.12)] backdrop-blur lg:w-72 lg:shrink-0">
          <div className="space-y-3 border-b border-[var(--line)] pb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--muted)]">
              Personal finance
            </p>
            <div>
              <h1 className="font-display text-3xl leading-none text-[var(--ink-strong)]">
                IWallet
              </h1>
              <p className="mt-2 max-w-xs text-sm leading-6 text-[var(--muted)]">
                A calm command center for planning income, tracking spending, and reading each month clearly.
              </p>
            </div>
          </div>

          <nav className="mt-5 space-y-3">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group block rounded-[1.4rem] border border-transparent bg-[var(--panel-soft)] px-4 py-3 transition hover:-translate-y-0.5 hover:border-[var(--line-strong)] hover:bg-white"
              >
                <span className="block text-sm font-semibold text-[var(--ink-strong)]">
                  {item.label}
                </span>
                <span className="mt-1 block text-xs uppercase tracking-[0.24em] text-[var(--muted)]">
                  {item.accent}
                </span>
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1 rounded-[2rem] border border-white/60 bg-white/80 p-5 shadow-[0_30px_80px_rgba(35,38,45,0.1)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-3 border-b border-[var(--line)] pb-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--accent-strong)]">
                Budget studio
              </p>
              <h2 className="mt-3 font-display text-4xl leading-tight text-[var(--ink-strong)]">
                {title}
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[var(--muted)]">{description}</p>
          </div>
          <div className="pt-6">{children}</div>
        </main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatCurrency, getExpenses, getIncome, getMonthlyReport } from "@/lib/api";
import { MonthlyReport } from "@/lib/types";

const quickLinks = [
  { href: "/income", label: "Add income", cue: "Log new cash in" },
  { href: "/expenses", label: "Track expense", cue: "Capture spending" },
  { href: "/reports", label: "Review report", cue: "Read the month" },
];

export function DashboardOverview() {
  const [monthKey, setMonthKey] = useState(new Date().toISOString().slice(0, 7));
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [incomeCount, setIncomeCount] = useState(0);
  const [expenseCount, setExpenseCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDashboard() {
      setError(null);

      try {
        const [nextReport, income, expenses] = await Promise.all([
          getMonthlyReport(monthKey),
          getIncome(monthKey),
          getExpenses(monthKey),
        ]);

        setReport(nextReport);
        setIncomeCount(income.length);
        setExpenseCount(expenses.length);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
      }
    }

    void loadDashboard();
  }, [monthKey]);

  return (
    <section className="space-y-6">
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] bg-[var(--ink-strong)] p-6 text-[var(--paper)] shadow-[0_20px_60px_rgba(24,31,32,0.2)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.35em] text-[var(--paper-soft)]">This month</p>
              <h3 className="mt-3 max-w-xl font-display text-4xl leading-tight">
                Shape the month before it surprises you.
              </h3>
            </div>
            <label className="space-y-2 text-sm">
              <span className="block text-xs uppercase tracking-[0.22em] text-[var(--paper-soft)]">Month</span>
              <input
                className="field field-dark"
                type="month"
                value={monthKey}
                onChange={(event) => setMonthKey(event.target.value)}
              />
            </label>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <MetricCard label="Income" value={formatCurrency(report?.totalIncome ?? 0)} accent="text-emerald-300" />
            <MetricCard label="Expenses" value={formatCurrency(report?.totalExpenses ?? 0)} accent="text-rose-300" />
            <MetricCard label="Net balance" value={formatCurrency(report?.netBalance ?? 0)} accent="text-amber-200" />
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel-soft)] p-6">
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Activity</p>
          <div className="mt-6 space-y-4">
            <ActivityRow label="Income entries" value={String(incomeCount)} />
            <ActivityRow label="Expense entries" value={String(expenseCount)} />
            <ActivityRow
              label="Top expense bucket"
              value={report?.expenseBreakdown[0]?.categoryName ?? "No spending yet"}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[2rem] border border-[var(--line)] bg-white p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Expense mix</p>
              <h3 className="mt-3 font-display text-3xl text-[var(--ink-strong)]">Where the money goes</h3>
            </div>
            <Link href="/reports" className="button-secondary">
              Open report
            </Link>
          </div>

          <div className="mt-6 space-y-4">
            {(report?.expenseBreakdown ?? []).length === 0 ? (
              <p className="text-sm leading-6 text-[var(--muted)]">No expense data yet for the selected month.</p>
            ) : (
              report?.expenseBreakdown.map((item) => {
                const max = report.expenseBreakdown[0]?.total ?? 1;
                const width = Math.max((item.total / max) * 100, 10);

                return (
                  <div key={item.categoryName} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-semibold text-[var(--ink-strong)]">{item.categoryName}</span>
                      <span className="text-[var(--muted)]">{formatCurrency(item.total)}</span>
                    </div>
                    <div className="h-3 rounded-full bg-[var(--panel-soft)]">
                      <div className="h-3 rounded-full bg-[linear-gradient(90deg,_#1f7a5c_0%,_#f59e0b_100%)]" style={{ width: `${width}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--panel-soft)] p-6">
          <p className="text-xs uppercase tracking-[0.32em] text-[var(--muted)]">Quick actions</p>
          <div className="mt-6 grid gap-4">
            {quickLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-[1.5rem] border border-[var(--line)] bg-white px-5 py-4 transition hover:-translate-y-0.5 hover:border-[var(--line-strong)]"
              >
                <span className="block font-semibold text-[var(--ink-strong)]">{item.label}</span>
                <span className="mt-1 block text-sm text-[var(--muted)]">{item.cue}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {error ? <div className="notice-error">{error}</div> : null}
    </section>
  );
}

type MetricCardProps = {
  label: string;
  value: string;
  accent: string;
};

function MetricCard({ label, value, accent }: MetricCardProps) {
  return (
    <div className="min-w-0 rounded-[1.5rem] bg-white/8 p-4">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--paper-soft)]">{label}</p>
      <p className={`mt-3 text-[clamp(1.25rem,3vw,1.875rem)] leading-tight font-semibold [overflow-wrap:anywhere] ${accent}`}>
        {value}
      </p>
    </div>
  );
}

type ActivityRowProps = {
  label: string;
  value: string;
};

function ActivityRow({ label, value }: ActivityRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.4rem] border border-[var(--line)] bg-white px-4 py-3">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className="font-semibold text-[var(--ink-strong)]">{value}</span>
    </div>
  );
}

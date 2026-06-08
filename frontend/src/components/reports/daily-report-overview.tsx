"use client";

import { useEffect, useState } from "react";
import { formatCurrency, getDailyReport } from "@/lib/api";
import { DailyReport } from "@/lib/types";

export function DailyReportOverview() {
  const [dayKey, setDayKey] = useState(new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<DailyReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDailyReport() {
      setError(null);

      try {
        setReport(await getDailyReport(dayKey));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load report.");
      }
    }

    void loadDailyReport();
  }, [dayKey]);

  const highestCategory = report?.expenseBreakdown[0]?.total ?? 1;

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] bg-[var(--panel-soft)] p-5">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Daily report</p>
          <h3 className="mt-3 font-display text-3xl text-[var(--ink-strong)]">Focus on one day at a time</h3>
        </div>
        <label className="space-y-2 text-sm">
          <span className="block text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Date</span>
          <input className="field" type="date" value={dayKey} onChange={(event) => setDayKey(event.target.value)} />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ReportStat label="Day income" value={formatCurrency(report?.totalIncome ?? 0)} tone="income" />
        <ReportStat label="Day expenses" value={formatCurrency(report?.totalExpenses ?? 0)} tone="expense" />
        <ReportStat label="Day balance" value={formatCurrency(report?.netBalance ?? 0)} tone="neutral" />
      </div>

      <div className="rounded-[1.75rem] border border-[var(--line)] bg-white p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--muted)]">Category breakdown</p>
            <h4 className="mt-2 font-display text-2xl text-[var(--ink-strong)]">Daily expense distribution</h4>
          </div>
          <p className="text-sm text-[var(--muted)]">Sorted from highest to lowest category total.</p>
        </div>

        <div className="mt-6 space-y-4">
          {(report?.expenseBreakdown ?? []).length === 0 ? (
            <p className="text-sm leading-6 text-[var(--muted)]">No expense data available for this day yet.</p>
          ) : (
            report?.expenseBreakdown.map((item) => {
              const width = Math.max((item.total / highestCategory) * 100, 8);

              return (
                <div key={item.categoryName} className="space-y-2">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <span className="font-semibold text-[var(--ink-strong)]">{item.categoryName}</span>
                    <span className="text-[var(--muted)]">{formatCurrency(item.total)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-[var(--panel-soft)]">
                    <div className="h-3 rounded-full bg-[linear-gradient(90deg,_#166534_0%,_#f97316_100%)]" style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {error ? <div className="notice-error">{error}</div> : null}
    </section>
  );
}

type ReportStatProps = {
  label: string;
  value: string;
  tone: "income" | "expense" | "neutral";
};

function ReportStat({ label, value, tone }: ReportStatProps) {
  const toneClass =
    tone === "income"
      ? "text-emerald-700"
      : tone === "expense"
        ? "text-rose-700"
        : "text-[var(--ink-strong)]";

  return (
    <div className="rounded-[1.5rem] border border-[var(--line)] bg-white p-5">
      <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">{label}</p>
      <p className={`mt-3 text-3xl font-semibold ${toneClass}`}>{value}</p>
    </div>
  );
}
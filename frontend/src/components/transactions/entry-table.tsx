"use client";

import { formatCurrency } from "@/lib/api";
import { EntryKind, ExpenseEntry, IncomeEntry } from "@/lib/types";

type EntryTableProps = {
  kind: EntryKind;
  items: IncomeEntry[] | ExpenseEntry[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  isBusy: boolean;
};

export function EntryTable({ kind, items, onEdit, onDelete, isBusy }: EntryTableProps) {
  const title = kind === "income" ? "Source" : "Merchant";
  const dateKey = kind === "income" ? "receivedOn" : "spentOn";

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[var(--line)] bg-white">
      <div className="grid grid-cols-[1.2fr_0.7fr_0.9fr_0.9fr_0.7fr] gap-3 border-b border-[var(--line)] px-5 py-4 text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
        <span>{title}</span>
        <span>Category</span>
        <span>Date</span>
        <span>Amount</span>
        <span className="text-right">Actions</span>
      </div>

      <div className="divide-y divide-[var(--line)]">
        {items.length === 0 ? (
          <div className="px-5 py-10 text-sm leading-6 text-[var(--muted)]">
            No entries yet for this month.
          </div>
        ) : (
          items.map((item) => {
            const heading = kind === "income" ? item.source : item.merchant;
            const dateValue = item[dateKey as keyof typeof item] as string;

            return (
              <div key={item.id} className="grid grid-cols-[1.2fr_0.7fr_0.9fr_0.9fr_0.7fr] gap-3 px-5 py-4 text-sm text-[var(--ink)]">
                <div>
                  <p className="font-semibold text-[var(--ink-strong)]">{heading}</p>
                  <p className="mt-1 text-xs text-[var(--muted)]">{item.notes || "No notes"}</p>
                </div>
                <span>{item.categoryName}</span>
                <span>{dateValue}</span>
                <span className={kind === "income" ? "text-emerald-700" : "text-rose-700"}>
                  {formatCurrency(item.amount)}
                </span>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => onEdit(item.id)} className="button-ghost">
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(item.id)}
                    className="button-ghost text-rose-700"
                    disabled={isBusy}
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

"use client";

import { FormEvent } from "react";
import { Category, EntryFormValues, EntryKind } from "@/lib/types";

type EntryFormProps = {
  kind: EntryKind;
  values: EntryFormValues;
  categories: Category[];
  isSubmitting: boolean;
  submitLabel: string;
  onChange: (field: keyof EntryFormValues, value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEdit?: () => void;
  isEditing: boolean;
};

export function EntryForm({
  kind,
  values,
  categories,
  isSubmitting,
  submitLabel,
  onChange,
  onSubmit,
  onCancelEdit,
  isEditing,
}: EntryFormProps) {
  const label = kind === "income" ? "Source" : "Merchant";
  const dateLabel = kind === "income" ? "Received on" : "Spent on";

  return (
    <form onSubmit={onSubmit} className="grid gap-4 rounded-[1.75rem] bg-[var(--panel-soft)] p-5 md:grid-cols-2">
      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          Amount
        </span>
        <input
          className="field"
          min="0"
          step="0.01"
          type="number"
          value={values.amount}
          onChange={(event) => onChange("amount", event.target.value)}
          placeholder="0.00"
          required
        />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          {label}
        </span>
        <input
          className="field"
          type="text"
          value={values.title}
          onChange={(event) => onChange("title", event.target.value)}
          placeholder={kind === "income" ? "Salary" : "Neighborhood market"}
          required
        />
      </label>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          Category
        </span>
        <select
          className="field"
          value={values.categoryId}
          onChange={(event) => onChange("categoryId", event.target.value)}
          required
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          {dateLabel}
        </span>
        <input
          className="field"
          type="date"
          value={values.date}
          onChange={(event) => onChange("date", event.target.value)}
          required
        />
      </label>

      <label className="space-y-2 md:col-span-2">
        <span className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--muted)]">
          Notes
        </span>
        <textarea
          className="field min-h-28 resize-y"
          value={values.notes}
          onChange={(event) => onChange("notes", event.target.value)}
          placeholder="Add context for this entry."
        />
      </label>

      <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm leading-6 text-[var(--muted)]">
          {kind === "income"
            ? "Capture every payment source so the monthly picture stays trustworthy."
            : "Track spending close to the moment it happens to keep reports honest."}
        </p>
        <div className="flex flex-wrap gap-3">
          {isEditing && onCancelEdit ? (
            <button type="button" onClick={onCancelEdit} className="button-secondary">
              Cancel
            </button>
          ) : null}
          <button type="submit" disabled={isSubmitting} className="button-primary">
            {isSubmitting ? "Saving..." : submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

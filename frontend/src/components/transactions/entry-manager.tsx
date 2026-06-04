"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  createExpense,
  createIncome,
  deleteExpense,
  deleteIncome,
  getCategories,
  getExpenses,
  getIncome,
  updateExpense,
  updateIncome,
} from "@/lib/api";
import { Category, EntryFormValues, EntryKind, ExpenseEntry, IncomeEntry } from "@/lib/types";
import { EntryForm } from "@/components/forms/entry-form";
import { EntryTable } from "@/components/transactions/entry-table";

const initialValues = (): EntryFormValues => ({
  amount: "",
  title: "",
  notes: "",
  date: new Date().toISOString().slice(0, 10),
  categoryId: "",
});

type EntryManagerProps = {
  kind: EntryKind;
};

export function EntryManager({ kind }: EntryManagerProps) {
  const [monthKey, setMonthKey] = useState(new Date().toISOString().slice(0, 7));
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Array<IncomeEntry | ExpenseEntry>>([]);
  const [values, setValues] = useState<EntryFormValues>(initialValues);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => (kind === "income" ? "Income" : "Expenses"), [kind]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [nextCategories, nextItems] = await Promise.all([
        getCategories(kind),
        kind === "income" ? getIncome(monthKey) : getExpenses(monthKey),
      ]);

      setCategories(nextCategories);
      setItems(nextItems);
      setValues((current) => ({
        ...current,
        categoryId: current.categoryId || nextCategories[0]?.id || "",
      }));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : `Unable to load ${title.toLowerCase()}.`);
    } finally {
      setIsLoading(false);
    }
  }, [kind, monthKey, title]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleChange = (field: keyof EntryFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setValues({
      ...initialValues(),
      categoryId: categories[0]?.id || "",
    });
    setEditingId(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const amount = Number(values.amount);

      if (Number.isNaN(amount) || amount <= 0) {
        throw new Error("Amount must be greater than zero.");
      }

      if (kind === "income") {
        const payload = {
          amount,
          source: values.title.trim(),
          notes: values.notes.trim(),
          receivedOn: values.date,
          categoryId: values.categoryId,
        };

        if (editingId) {
          await updateIncome(editingId, payload);
        } else {
          await createIncome(payload);
        }
      } else {
        const payload = {
          amount,
          merchant: values.title.trim(),
          notes: values.notes.trim(),
          spentOn: values.date,
          categoryId: values.categoryId,
        };

        if (editingId) {
          await updateExpense(editingId, payload);
        } else {
          await createExpense(payload);
        }
      }

      resetForm();
      await loadData();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setIsSubmitting(true);
    setError(null);

    try {
      if (kind === "income") {
        await deleteIncome(id);
      } else {
        await deleteExpense(id);
      }

      if (editingId === id) {
        resetForm();
      }

      await loadData();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete entry.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (id: string) => {
    const selected = items.find((item) => item.id === id);
    if (!selected) {
      return;
    }

    setEditingId(id);
    setValues({
      amount: String(selected.amount),
      title: kind === "income" ? (selected as IncomeEntry).source : (selected as ExpenseEntry).merchant,
      notes: selected.notes,
      date: kind === "income" ? (selected as IncomeEntry).receivedOn : (selected as ExpenseEntry).spentOn,
      categoryId: selected.categoryId,
    });
  };

  return (
    <section className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[1.75rem] bg-[var(--ink-strong)] p-5 text-[var(--paper)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--paper-soft)]">Monthly focus</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h3 className="font-display text-3xl">{title}</h3>
              <p className="mt-2 max-w-sm text-sm leading-6 text-[var(--paper-soft)]">
                Filter by month, keep details tidy, and quickly adjust entries when the numbers change.
              </p>
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
        </div>

        <EntryForm
          kind={kind}
          values={values}
          categories={categories}
          isSubmitting={isSubmitting}
          submitLabel={editingId ? `Update ${kind}` : `Add ${kind}`}
          onChange={handleChange}
          onSubmit={handleSubmit}
          onCancelEdit={resetForm}
          isEditing={editingId !== null}
        />
      </div>

      {error ? <div className="notice-error">{error}</div> : null}
      {isLoading ? <div className="notice">Loading {title.toLowerCase()}...</div> : null}

      <EntryTable kind={kind} items={items} onEdit={handleEdit} onDelete={handleDelete} isBusy={isSubmitting} />
    </section>
  );
}

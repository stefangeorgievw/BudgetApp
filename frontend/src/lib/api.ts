import {
  Category,
  EntryKind,
  ExpenseEntry,
  IncomeEntry,
  MonthlyReport,
} from "@/lib/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5100";

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as { title?: string; detail?: string };
      throw new Error(body.detail ?? body.title ?? fallbackMessage);
    } catch {
      throw new Error(fallbackMessage);
    }
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

function toQuery(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  return `year=${year}&month=${month}`;
}

export async function getCategories(kind: EntryKind): Promise<Category[]> {
  const type = kind === "income" ? "Income" : "Expense";
  return apiRequest<Category[]>(`/api/categories?type=${type}`);
}

export async function getIncome(monthKey: string): Promise<IncomeEntry[]> {
  return apiRequest<IncomeEntry[]>(`/api/income?${toQuery(monthKey)}`);
}

export async function createIncome(payload: {
  amount: number;
  source: string;
  notes: string;
  receivedOn: string;
  categoryId: string;
}) {
  return apiRequest<{ id: string }>("/api/income", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateIncome(
  id: string,
  payload: {
    amount: number;
    source: string;
    notes: string;
    receivedOn: string;
    categoryId: string;
  },
) {
  return apiRequest<void>(`/api/income/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteIncome(id: string) {
  return apiRequest<void>(`/api/income/${id}`, {
    method: "DELETE",
  });
}

export async function getExpenses(monthKey: string): Promise<ExpenseEntry[]> {
  return apiRequest<ExpenseEntry[]>(`/api/expenses?${toQuery(monthKey)}`);
}

export async function createExpense(payload: {
  amount: number;
  merchant: string;
  notes: string;
  spentOn: string;
  categoryId: string;
}) {
  return apiRequest<{ id: string }>("/api/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateExpense(
  id: string,
  payload: {
    amount: number;
    merchant: string;
    notes: string;
    spentOn: string;
    categoryId: string;
  },
) {
  return apiRequest<void>(`/api/expenses/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteExpense(id: string) {
  return apiRequest<void>(`/api/expenses/${id}`, {
    method: "DELETE",
  });
}

export async function getMonthlyReport(monthKey: string): Promise<MonthlyReport> {
  return apiRequest<MonthlyReport>(`/api/reports/monthly?${toQuery(monthKey)}`);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

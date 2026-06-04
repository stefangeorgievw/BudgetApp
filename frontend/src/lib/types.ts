export type CategoryType = "Income" | "Expense";

export type Category = {
  id: string;
  name: string;
  type: CategoryType;
};

export type IncomeEntry = {
  id: string;
  amount: number;
  source: string;
  notes: string;
  receivedOn: string;
  categoryId: string;
  categoryName: string;
};

export type ExpenseEntry = {
  id: string;
  amount: number;
  merchant: string;
  notes: string;
  spentOn: string;
  categoryId: string;
  categoryName: string;
};

export type EntryKind = "income" | "expense";

export type EntryFormValues = {
  amount: string;
  title: string;
  notes: string;
  date: string;
  categoryId: string;
};

export type MonthlyReport = {
  year: number;
  month: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  expenseBreakdown: Array<{
    categoryName: string;
    total: number;
  }>;
};

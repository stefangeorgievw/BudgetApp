import { expect, Page, test } from "@playwright/test";

type Category = {
  id: string;
  name: string;
  type: "Income" | "Expense";
};

type IncomeEntry = {
  id: string;
  amount: number;
  source: string;
  notes: string;
  receivedOn: string;
  categoryId: string;
  categoryName: string;
};

type ExpenseEntry = {
  id: string;
  amount: number;
  merchant: string;
  notes: string;
  spentOn: string;
  categoryId: string;
  categoryName: string;
};

type MonthlyReport = {
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

type DailyReport = {
  date: string;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  expenseBreakdown: Array<{
    categoryName: string;
    total: number;
  }>;
};

type DataStore = {
  categories: Category[];
  incomeEntries: IncomeEntry[];
  expenseEntries: ExpenseEntry[];
};

function buildDataStore(): DataStore {
  return {
    categories: [
      { id: "income-salary", name: "Salary", type: "Income" },
      { id: "income-freelance", name: "Freelance", type: "Income" },
      { id: "expense-housing", name: "Housing", type: "Expense" },
      { id: "expense-groceries", name: "Groceries", type: "Expense" },
    ],
    incomeEntries: [
      {
        id: "income-1",
        amount: 4000,
        source: "Main salary",
        notes: "June payroll",
        receivedOn: "2026-06-01",
        categoryId: "income-salary",
        categoryName: "Salary",
      },
    ],
    expenseEntries: [
      {
        id: "expense-1",
        amount: 1200,
        merchant: "Landlord",
        notes: "June rent",
        spentOn: "2026-06-02",
        categoryId: "expense-housing",
        categoryName: "Housing",
      },
      {
        id: "expense-2",
        amount: 140,
        merchant: "Fresh Market",
        notes: "Weekly groceries",
        spentOn: "2026-06-03",
        categoryId: "expense-groceries",
        categoryName: "Groceries",
      },
    ],
  };
}

function matchesMonth(dateValue: string, year: string | null, month: string | null) {
  if (!year || !month) {
    return true;
  }

  return dateValue.startsWith(`${year}-${month.padStart(2, "0")}`);
}

function buildMonthlyReport(store: DataStore, year: string | null, month: string | null): MonthlyReport {
  const incomeEntries = store.incomeEntries.filter((entry) => matchesMonth(entry.receivedOn, year, month));
  const expenseEntries = store.expenseEntries.filter((entry) => matchesMonth(entry.spentOn, year, month));
  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const expenseBreakdown = store.categories
    .filter((category) => category.type === "Expense")
    .map((category) => ({
      categoryName: category.name,
      total: expenseEntries
        .filter((entry) => entry.categoryId === category.id)
        .reduce((sum, entry) => sum + entry.amount, 0),
    }))
    .filter((item) => item.total > 0)
    .sort((left, right) => right.total - left.total);

  return {
    year: Number(year ?? "2026"),
    month: Number(month ?? "6"),
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    expenseBreakdown,
  };
}

function buildDailyReport(store: DataStore, date: string | null): DailyReport {
  const incomeEntries = store.incomeEntries.filter((entry) => entry.receivedOn === date);
  const expenseEntries = store.expenseEntries.filter((entry) => entry.spentOn === date);
  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalExpenses = expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const expenseBreakdown = store.categories
    .filter((category) => category.type === "Expense")
    .map((category) => ({
      categoryName: category.name,
      total: expenseEntries
        .filter((entry) => entry.categoryId === category.id)
        .reduce((sum, entry) => sum + entry.amount, 0),
    }))
    .filter((item) => item.total > 0)
    .sort((left, right) => right.total - left.total);

  return {
    date: date ?? "2026-06-03",
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    expenseBreakdown,
  };
}

async function mockApi(page: Page) {
  const store = buildDataStore();
  let nextIncomeId = 2;
  let nextExpenseId = 3;

  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const method = request.method();
    const path = url.pathname;

    if (path === "/api/categories" && method === "GET") {
      const type = url.searchParams.get("type");
      const categories = store.categories.filter((category) => category.type === type);
      await route.fulfill({ json: categories });
      return;
    }

    if (path === "/api/income" && method === "GET") {
      const year = url.searchParams.get("year");
      const month = url.searchParams.get("month");
      const incomeEntries = store.incomeEntries.filter((entry) => matchesMonth(entry.receivedOn, year, month));
      await route.fulfill({ json: incomeEntries });
      return;
    }

    if (path === "/api/income" && method === "POST") {
      const payload = JSON.parse(request.postData() ?? "{}") as {
        amount: number;
        source: string;
        notes: string;
        receivedOn: string;
        categoryId: string;
      };
      const category = store.categories.find((item) => item.id === payload.categoryId);
      const entry: IncomeEntry = {
        id: `income-${nextIncomeId++}`,
        amount: payload.amount,
        source: payload.source,
        notes: payload.notes,
        receivedOn: payload.receivedOn,
        categoryId: payload.categoryId,
        categoryName: category?.name ?? "Unknown",
      };
      store.incomeEntries.unshift(entry);
      await route.fulfill({ status: 201, json: { id: entry.id } });
      return;
    }

    if (path.startsWith("/api/income/") && method === "PUT") {
      const entryId = path.split("/").pop();
      const payload = JSON.parse(request.postData() ?? "{}") as {
        amount: number;
        source: string;
        notes: string;
        receivedOn: string;
        categoryId: string;
      };
      const category = store.categories.find((item) => item.id === payload.categoryId);
      store.incomeEntries = store.incomeEntries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              amount: payload.amount,
              source: payload.source,
              notes: payload.notes,
              receivedOn: payload.receivedOn,
              categoryId: payload.categoryId,
              categoryName: category?.name ?? "Unknown",
            }
          : entry,
      );
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    if (path.startsWith("/api/income/") && method === "DELETE") {
      const entryId = path.split("/").pop();
      store.incomeEntries = store.incomeEntries.filter((entry) => entry.id !== entryId);
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    if (path === "/api/expenses" && method === "GET") {
      const year = url.searchParams.get("year");
      const month = url.searchParams.get("month");
      const expenseEntries = store.expenseEntries.filter((entry) => matchesMonth(entry.spentOn, year, month));
      await route.fulfill({ json: expenseEntries });
      return;
    }

    if (path === "/api/expenses" && method === "POST") {
      const payload = JSON.parse(request.postData() ?? "{}") as {
        amount: number;
        merchant: string;
        notes: string;
        spentOn: string;
        categoryId: string;
      };
      const category = store.categories.find((item) => item.id === payload.categoryId);
      const entry: ExpenseEntry = {
        id: `expense-${nextExpenseId++}`,
        amount: payload.amount,
        merchant: payload.merchant,
        notes: payload.notes,
        spentOn: payload.spentOn,
        categoryId: payload.categoryId,
        categoryName: category?.name ?? "Unknown",
      };
      store.expenseEntries.unshift(entry);
      await route.fulfill({ status: 201, json: { id: entry.id } });
      return;
    }

    if (path.startsWith("/api/expenses/") && method === "PUT") {
      const entryId = path.split("/").pop();
      const payload = JSON.parse(request.postData() ?? "{}") as {
        amount: number;
        merchant: string;
        notes: string;
        spentOn: string;
        categoryId: string;
      };
      const category = store.categories.find((item) => item.id === payload.categoryId);
      store.expenseEntries = store.expenseEntries.map((entry) =>
        entry.id === entryId
          ? {
              ...entry,
              amount: payload.amount,
              merchant: payload.merchant,
              notes: payload.notes,
              spentOn: payload.spentOn,
              categoryId: payload.categoryId,
              categoryName: category?.name ?? "Unknown",
            }
          : entry,
      );
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    if (path.startsWith("/api/expenses/") && method === "DELETE") {
      const entryId = path.split("/").pop();
      store.expenseEntries = store.expenseEntries.filter((entry) => entry.id !== entryId);
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    if (path === "/api/reports/monthly" && method === "GET") {
      const report = buildMonthlyReport(store, url.searchParams.get("year"), url.searchParams.get("month"));
      await route.fulfill({ json: report });
      return;
    }

    if (path === "/api/reports/daily" && method === "GET") {
      const report = buildDailyReport(store, url.searchParams.get("date"));
      await route.fulfill({ json: report });
      return;
    }

    await route.abort();
  });
}

function statCard(page: Page, label: string) {
  return page.locator("div").filter({ has: page.getByText(label, { exact: true }) }).first();
}

function rowForText(page: Page, text: string) {
  return page.locator("div").filter({ has: page.getByText(text, { exact: true }) }).first();
}

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("navigates from dashboard and renders monthly summary widgets", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(statCard(page, "Income")).toContainText("$4,000.00");
  await expect(statCard(page, "Expenses")).toContainText("$1,340.00");
  await expect(statCard(page, "Net balance")).toContainText("$2,660.00");
  await expect(rowForText(page, "Top expense bucket")).toContainText("Housing");

  await page.getByRole("link", { name: /Monthly report/i }).click();

  await expect(page).toHaveURL(/\/reports\/monthly$/);
  await expect(page.getByRole("heading", { name: "Monthly Report" })).toBeVisible();
  await expect(page.getByText("Expense distribution")).toBeVisible();
});

test("creates, edits, and deletes an income entry", async ({ page }) => {
  await page.goto("/income");

  await page.getByRole("spinbutton").fill("850");
  await page.getByRole("textbox", { name: /Source/i }).fill("Bonus");
  await page.getByRole("combobox", { name: /Category/i }).selectOption("income-freelance");
  await page.getByRole("textbox", { name: /Notes/i }).fill("Quarterly performance bonus");
  await page.getByRole("button", { name: /Add income/i }).click();

  const bonusRow = rowForText(page, "Bonus");
  await expect(bonusRow).toContainText("$850.00");
  await expect(bonusRow).toContainText("Freelance");

  await page.getByRole("button", { name: "Edit" }).first().click();
  await page.getByRole("spinbutton").fill("900");
  await page.getByRole("textbox", { name: /Source/i }).fill("Updated Bonus");
  await page.getByRole("button", { name: /Update income/i }).click();

  const updatedRow = page
    .getByText("Updated Bonus", { exact: true })
    .locator("xpath=ancestor::div[contains(@class, 'grid')][1]");
  await expect(updatedRow).toContainText("$900.00");

  await updatedRow.getByRole("button", { name: "Delete" }).click();

  await expect(page.getByText("Updated Bonus", { exact: true })).toHaveCount(0);
  await expect(page.getByText("$900.00", { exact: true })).toHaveCount(0);
});

test("loads daily report details for a selected date", async ({ page }) => {
  await page.goto("/reports/daily");

  await page.getByLabel(/Date/i).fill("2026-06-03");

  await expect(statCard(page, "Day income")).toContainText("$0.00");
  await expect(statCard(page, "Day expenses")).toContainText("$140.00");
  await expect(statCard(page, "Day balance")).toContainText("-$140.00");
  await expect(page.getByText("Groceries", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Daily expense distribution")).toBeVisible();
});
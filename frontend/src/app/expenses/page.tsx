import { AppShell } from "@/components/layout/app-shell";
import { EntryManager } from "@/components/transactions/entry-manager";

export default function ExpensesPage() {
  return (
    <AppShell
      title="Expenses"
      description="Stay ahead of spending by reviewing and adjusting outflows every month."
    >
      <EntryManager kind="expense" />
    </AppShell>
  );
}

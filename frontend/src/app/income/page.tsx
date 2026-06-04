import { AppShell } from "@/components/layout/app-shell";
import { EntryManager } from "@/components/transactions/entry-manager";

export default function IncomePage() {
  return (
    <AppShell
      title="Income"
      description="Capture every incoming payment and keep the month aligned with reality."
    >
      <EntryManager kind="income" />
    </AppShell>
  );
}

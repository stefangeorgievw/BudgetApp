import { AppShell } from "@/components/layout/app-shell";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

export default function Home() {
  return (
    <AppShell
      title="Dashboard"
      description="Track cash flow at a glance, then jump straight into the month that needs attention."
    >
      <DashboardOverview />
    </AppShell>
  );
}

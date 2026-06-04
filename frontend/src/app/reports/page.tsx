import { AppShell } from "@/components/layout/app-shell";
import { ReportOverview } from "@/components/reports/report-overview";

export default function ReportsPage() {
  return (
    <AppShell
      title="Reports"
      description="Read the month in totals and category breakdowns before moving on."
    >
      <ReportOverview />
    </AppShell>
  );
}

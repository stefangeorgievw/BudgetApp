import { AppShell } from "@/components/layout/app-shell";
import { DailyReportOverview } from "@/components/reports/daily-report-overview";

export default function DailyReportsPage() {
  return (
    <AppShell
      title="Daily Report"
      description="Zoom in on one day to compare income, spending, and balance with category detail."
    >
      <DailyReportOverview />
    </AppShell>
  );
}

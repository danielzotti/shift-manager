import { createFileRoute } from '@tanstack/react-router';
import { PlannerView } from '../../components/PlannerView';

export const Route = createFileRoute('/plan/month')({
  component: MonthPlanPage,
});

function MonthPlanPage() {
  return <PlannerView viewMode="month" />;
}

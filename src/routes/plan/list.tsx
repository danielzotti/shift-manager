import { createFileRoute } from '@tanstack/react-router';
import { PlannerView } from '../../components/PlannerView';

export const Route = createFileRoute('/plan/list')({
  component: ListPlanPage,
});

function ListPlanPage() {
  return <PlannerView viewMode="list" />;
}

import { createFileRoute } from '@tanstack/react-router';
import { SettingsView } from '../../components/SettingsView';

export const Route = createFileRoute('/config/shifts')({
  component: ConfigShiftsPage,
});

function ConfigShiftsPage() {
  return <SettingsView activeTab="shifts" />;
}

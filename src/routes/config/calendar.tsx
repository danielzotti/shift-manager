import { createFileRoute } from '@tanstack/react-router';
import { SettingsView } from '../../components/SettingsView';

export const Route = createFileRoute('/config/calendar')({
  component: ConfigCalendarPage,
});

function ConfigCalendarPage() {
  return <SettingsView activeTab="calendar" />;
}

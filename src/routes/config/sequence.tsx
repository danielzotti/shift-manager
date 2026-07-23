import { createFileRoute } from '@tanstack/react-router';
import { SettingsView } from '../../components/SettingsView';

export const Route = createFileRoute('/config/sequence')({
  component: ConfigSequencePage,
});

function ConfigSequencePage() {
  return <SettingsView activeTab="sequence" />;
}

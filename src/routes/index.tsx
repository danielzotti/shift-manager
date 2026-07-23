import { createFileRoute } from '@tanstack/react-router';
import { AuthProvider } from '../components/AuthContext';
import { MainApp } from '../components/MainApp';
import '../i18n';

export const Route = createFileRoute('/')({
  component: App,
});

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

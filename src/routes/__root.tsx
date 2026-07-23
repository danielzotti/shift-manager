import { createRootRoute, Outlet } from '@tanstack/react-router';
import { AuthProvider } from '../components/AuthContext';
import { MainAppLayout } from '../components/MainAppLayout';
import '../i18n';

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  return (
    <AuthProvider>
      <MainAppLayout>
        <Outlet />
      </MainAppLayout>
    </AuthProvider>
  );
}

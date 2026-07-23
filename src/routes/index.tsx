import { createFileRoute, Navigate } from '@tanstack/react-router';
import { useAuth } from '../components/AuthContext';
import { WelcomeLanding } from '../components/WelcomeLanding';

export const Route = createFileRoute('/')({
  component: IndexPage,
});

function IndexPage() {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/plan/month" replace />;
  }

  return <WelcomeLanding />;
}

import { createFileRoute } from '@tanstack/react-router';
import { ProfileView } from '../components/ProfileView';

export const Route = createFileRoute('/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  return <ProfileView />;
}

import type { UserProfile } from '../types/shift';

declare global {
  interface Window {
    google?: any;
  }
}

const SCOPES = 'openid email profile https://www.googleapis.com/auth/calendar';

/**
 * Initializes Google OAuth Token Client and requests authorization.
 */
export function requestGoogleLogin(onSuccess: (user: UserProfile) => void, onError: (err: any) => void) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (!clientId) {
    console.warn('VITE_GOOGLE_CLIENT_ID missing in environment variables. Falling back to Google GIS prompt or mock login warning.');
  }

  if (typeof window === 'undefined' || !window.google?.accounts?.oauth2) {
    onError(new Error('Google Identity Services SDK non ancora caricato. Riprova tra qualche secondo.'));
    return;
  }

  const tokenClient = window.google.accounts.oauth2.initTokenClient({
    client_id: clientId || 'YOUR_GOOGLE_CLIENT_ID',
    scope: SCOPES,
    callback: async (tokenResponse: any) => {
      if (tokenResponse.error) {
        onError(tokenResponse);
        return;
      }

      const accessToken = tokenResponse.access_token;

      try {
        // Fetch user info using Google OAuth2 API
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch user profile: ${res.statusText}`);
        }

        const data = await res.json();

        const user: UserProfile = {
          name: data.name || data.given_name || 'Utente Google',
          email: data.email || '',
          picture: data.picture || 'https://lh3.googleusercontent.com/a/default-user=s96-c',
          accessToken: accessToken,
        };

        onSuccess(user);
      } catch (err) {
        onError(err);
      }
    },
  });

  // Prompt consent or account selection
  tokenClient.requestAccessToken({ prompt: 'consent' });
}

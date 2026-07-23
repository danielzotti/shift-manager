import React, { createContext, useContext, useState } from 'react';
import type { CalendarConfig, UserProfile } from '../types/shift';
import { DEFAULT_SEQUENCE, DEFAULT_SHIFTS, normalizeCalendarConfig } from '../types/shift';

import { requestGoogleLogin } from '../services/googleAuthService';

interface AuthContextType {
  user: UserProfile | null;
  login: () => void;
  logout: (reason?: string) => void;
  authError: string | null;
  config: CalendarConfig;
  updateConfig: (newConfig: Partial<CalendarConfig>) => void;
  draftAssignments: Record<string, any>; // local storage draft by month key
  saveDraft: (monthKey: string, data: any) => void;
  clearDraft: (monthKey: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_STORAGE_USER_KEY = 'shift_manager_user';
const LOCAL_STORAGE_CONFIG_KEY = 'shift_manager_config';
const LOCAL_STORAGE_DRAFT_KEY = 'shift_manager_drafts';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [config, setConfig] = useState<CalendarConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_CONFIG_KEY);
      if (saved) {
        try {
          return normalizeCalendarConfig(JSON.parse(saved));
        } catch (e) {
          // ignore parse error
        }
      }
    }
    return normalizeCalendarConfig(null);
  });

  const [draftAssignments, setDraftAssignments] = useState<Record<string, any>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_STORAGE_DRAFT_KEY);
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  const updateConfig = (newConfig: Partial<CalendarConfig>) => {
    setConfig((prev) => {
      const updated = normalizeCalendarConfig({ ...prev, ...newConfig });
      localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const logout = (reason?: string) => {
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    setAuthError(reason || null);
  };

  const login = () => {
    setAuthError(null);
    requestGoogleLogin(
      (loggedInUser) => {
        setUser(loggedInUser);
        localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(loggedInUser));

        // Ensure dedicated Shift Manager calendar exists on login using stored calendarName
        if (loggedInUser.accessToken) {
          import('../services/googleCalendarService')
            .then(({ getOrCreateShiftCalendar }) => getOrCreateShiftCalendar(loggedInUser.accessToken, config.calendarName))
            .catch((err) => {
              console.error('Failed to create or verify Shift Manager calendar on login:', err);
              if (err?.status === 401 || err?.isUnauthenticated) {
                logout('Sessione di autenticazione scaduta o non valida. Effettua nuovamente il login con Google.');
              }
            });
        }
      },
      (error) => {
        console.error('Google Auth Error:', error);
        setAuthError(error?.message || 'Autenticazione con Google annullata o fallita.');
      }
    );
  };

  const saveDraft = (monthKey: string, data: any) => {
    setDraftAssignments((prev) => {
      const updated = { ...prev, [monthKey]: data };
      localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearDraft = (monthKey: string) => {
    setDraftAssignments((prev) => {
      const updated = { ...prev };
      delete updated[monthKey];
      localStorage.setItem(LOCAL_STORAGE_DRAFT_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        authError,
        config,
        updateConfig,
        draftAssignments,
        saveDraft,
        clearDraft,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

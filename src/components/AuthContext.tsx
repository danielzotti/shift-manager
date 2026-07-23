import React, { createContext, useContext, useState } from 'react';
import type { CalendarConfig, UserProfile } from '../types/shift';
import { DEFAULT_SEQUENCE, DEFAULT_SHIFTS } from '../types/shift';

interface AuthContextType {
  user: UserProfile | null;
  login: () => void;
  logout: () => void;
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
      if (saved) return JSON.parse(saved);
    }
    return {
      calendarName: 'Turni di Lavoro',
      shifts: DEFAULT_SHIFTS,
      sequence: DEFAULT_SEQUENCE,
    };
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
      const updated = { ...prev, ...newConfig };
      localStorage.setItem(LOCAL_STORAGE_CONFIG_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const login = () => {
    // Simulated Google OAuth login flow (or GIS integration placeholder)
    const mockUser: UserProfile = {
      name: 'Mario Rossi',
      email: 'mario.rossi@gmail.com',
      picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
      accessToken: 'mock_google_access_token_' + Date.now(),
    };
    setUser(mockUser);
    localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
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

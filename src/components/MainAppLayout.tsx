import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Calendar, Settings, User, Globe, AlertTriangle, X } from 'lucide-react';
import { useAuth } from './AuthContext';
import { WelcomeLanding } from './WelcomeLanding';
import { Logo } from './Logo';

export const MainAppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { user, googleCalendarError, clearGoogleCalendarError } = useAuth();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  const isPublicPath = currentPath === '/privacy' || currentPath === '/terms';

  if (!user && !isPublicPath) {
    return <WelcomeLanding />;
  }

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'it' ? 'en' : 'it');
  };

  const isPlanActive = currentPath.startsWith('/plan');
  const isConfigActive = currentPath.startsWith('/config');
  const isProfileActive = currentPath.startsWith('/profile');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link
            to="/plan/month"
            className="flex items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-xl transition hover:opacity-80 cursor-pointer"
          >
            <Logo className="w-9 h-9 drop-shadow-md" />
            <span className="font-bold text-lg text-white">{t('app.title')}</span>
          </Link>

          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition"
          >
            <Globe className="w-3.5 h-3.5" />
            {i18n.language.toUpperCase()}
          </button>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        {googleCalendarError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center justify-between gap-3 shadow-lg shadow-red-950/20">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span className="font-medium">{googleCalendarError}</span>
            </div>
            <button
              onClick={clearGoogleCalendarError}
              className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-300 transition cursor-pointer"
              title="Chiudi"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {children}
      </main>

      {/* Bottom Navigation Bar for Mobile & Desktop (Only when logged in) */}
      {user ? (
        <nav className="sticky bottom-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 py-2 px-4">
          <div className="max-w-md mx-auto flex justify-around items-center">
            <Link
              to="/plan/month"
              className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition ${
                isPlanActive ? 'text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[11px]">{t('nav.planner')}</span>
            </Link>

            <Link
              to="/config/shifts"
              className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition ${
                isConfigActive ? 'text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span className="text-[11px]">{t('nav.settings')}</span>
            </Link>

            <Link
              to="/profile"
              className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition ${
                isProfileActive ? 'text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="text-[11px]">{t('nav.profile')}</span>
            </Link>
          </div>
        </nav>
      ) : (
        <footer className="py-4 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
          <span>Shift Manager PWA &copy; {new Date().getFullYear()}</span>
          <span className="hidden sm:inline">•</span>
          <div className="flex items-center gap-3">
            <Link to="/privacy" className="hover:text-cyan-400 underline transition">{t('footer.privacy')}</Link>
            <span>•</span>
            <Link to="/terms" className="hover:text-cyan-400 underline transition">{t('footer.terms')}</Link>
          </div>
        </footer>
      )}
    </div>
  );
};

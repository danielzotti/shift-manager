import React from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Calendar, Settings, User, Globe } from 'lucide-react';
import { useAuth } from './AuthContext';
import { WelcomeLanding } from './WelcomeLanding';
import { Logo } from './Logo';

export const MainAppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  if (!user) {
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
        {children}
      </main>

      {/* Bottom Navigation Bar for Mobile & Desktop */}
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
    </div>
  );
};

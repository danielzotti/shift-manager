import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Settings, User, Globe } from 'lucide-react';
import { useAuth } from './AuthContext';
import { WelcomeLanding } from './WelcomeLanding';
import { PlannerView } from './PlannerView';
import { SettingsView } from './SettingsView';
import { ProfileView } from './ProfileView';

export const MainApp: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [currentTab, setCurrentTab] = useState<'planner' | 'settings' | 'profile'>('planner');

  if (!user) {
    return <WelcomeLanding />;
  }

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'it' ? 'en' : 'it');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-white">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg text-white">{t('app.title')}</span>
          </div>

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
        {currentTab === 'planner' && <PlannerView />}
        {currentTab === 'settings' && <SettingsView />}
        {currentTab === 'profile' && <ProfileView />}
      </main>

      {/* Bottom Navigation Bar for Mobile & Desktop */}
      <nav className="sticky bottom-0 z-50 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800/80 py-2 px-4">
        <div className="max-w-md mx-auto flex justify-around items-center">
          <button
            onClick={() => setCurrentTab('planner')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition ${
              currentTab === 'planner' ? 'text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[11px]">{t('nav.planner')}</span>
          </button>

          <button
            onClick={() => setCurrentTab('settings')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition ${
              currentTab === 'settings' ? 'text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[11px]">{t('nav.settings')}</span>
          </button>

          <button
            onClick={() => setCurrentTab('profile')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition ${
              currentTab === 'profile' ? 'text-cyan-400 font-bold' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[11px]">{t('nav.profile')}</span>
          </button>
        </div>
      </nav>
    </div>
  );
};

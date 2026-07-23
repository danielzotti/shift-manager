import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, RefreshCw, Zap, Smartphone, LogIn, CheckCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import { Logo } from './Logo';

export const WelcomeLanding: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { login, authError } = useAuth();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'it' ? 'en' : 'it');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-8 selection:bg-cyan-500 selection:text-white">
      {/* Top Bar */}
      <header className="max-w-6xl w-full mx-auto flex justify-between items-center py-4">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10 drop-shadow-md" />
          <span className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white via-cyan-200 to-cyan-400 tracking-tight">
            Shift Manager
          </span>
        </div>
        <button
          onClick={toggleLanguage}
          className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition"
        >
          🌐 {i18n.language.toUpperCase()}
        </button>
      </header>

      {/* Hero Content */}
      <main className="max-w-4xl w-full mx-auto text-center my-auto py-12 flex flex-col items-center gap-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-400 text-xs font-medium backdrop-blur-md">
          <Zap className="w-4 h-4" />
          <span>{t('app.tagline')}</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
          {t('auth.welcomeTitle')}
        </h1>

        <p className="text-slate-400 text-base sm:text-xl max-w-2xl leading-relaxed">
          {t('auth.welcomeSubtitle')}
        </p>

        {/* Login CTA Button */}
        <button
          onClick={login}
          className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 font-bold text-white text-lg shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <LogIn className="w-6 h-6" />
          <span>{t('auth.loginGoogle')}</span>
        </button>

        {authError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold max-w-md">
            ⚠️ {authError}
          </div>
        )}

        <p className="text-xs text-slate-500 max-w-md">
          🔒 {t('auth.requiresAuth')}
        </p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-8 text-left">
          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
              <RefreshCw className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-200">{t('auth.feature1Title')}</h3>
            <p className="text-sm text-slate-400">{t('auth.feature1Desc')}</p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-200">{t('auth.feature2Title')}</h3>
            <p className="text-sm text-slate-400">{t('auth.feature2Desc')}</p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-200">{t('auth.feature3Title')}</h3>
            <p className="text-sm text-slate-400">{t('auth.feature3Desc')}</p>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800/80 bg-slate-900/40 backdrop-blur-xl hover:border-slate-700 transition">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-slate-200">{t('auth.feature4Title')}</h3>
            <p className="text-sm text-slate-400">{t('auth.feature4Desc')}</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-4 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <span>Shift Manager PWA &copy; {new Date().getFullYear()}</span>
        <span className="hidden sm:inline">•</span>
        <div className="flex items-center gap-3">
          <a href="/privacy" className="hover:text-cyan-400 underline transition">{t('footer.privacy')}</a>
          <span>•</span>
          <a href="/terms" className="hover:text-cyan-400 underline transition">{t('footer.terms')}</a>
        </div>
      </footer>
    </div>
  );
};

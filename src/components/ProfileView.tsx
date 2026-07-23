import React from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut, Calendar, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from './AuthContext';

export const ProfileView: React.FC = () => {
  const { t } = useTranslation();
  const { user, logout, config } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">{t('profile.title')}</h2>
      </div>

      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-6">
        <div className="flex items-center gap-4">
          <img
            src={user.picture}
            alt={user.name}
            className="w-16 h-16 rounded-2xl border-2 border-cyan-500/50 shadow-lg shadow-cyan-500/20"
          />
          <div>
            <h3 className="text-xl font-bold text-white">{user.name}</h3>
            <p className="text-sm text-slate-400 flex items-center gap-1.5 mt-0.5">
              <Mail className="w-4 h-4 text-cyan-400" />
              {user.email}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400">
              {t('profile.activeCalendar')}
            </span>
            <span className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4" />
              {config.calendarName}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs font-semibold text-slate-400">
              {t('profile.calendarStatus')}
            </span>
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              Google Calendar Connesso
            </span>
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-sm border border-red-500/20 transition flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          {t('profile.logoutBtn')}
        </button>

        <div className="pt-4 border-t border-slate-800/60 flex items-center justify-center gap-4 text-xs text-slate-500">
          <a href="/privacy" className="hover:text-cyan-400 underline transition">{t('footer.privacy')}</a>
          <span>•</span>
          <a href="/terms" className="hover:text-cyan-400 underline transition">{t('footer.terms')}</a>
        </div>
      </div>
    </div>
  );
};

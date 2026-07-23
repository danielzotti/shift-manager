import { createFileRoute } from '@tanstack/react-router';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/privacy')({
  component: PrivacyPage,
});

function PrivacyPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-slate-200">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
        <ShieldCheck className="w-8 h-8 text-cyan-400 shrink-0" />
        <div>
          <h1 className="text-3xl font-bold text-white">{t('privacy.title')}</h1>
          <p className="text-sm text-slate-400">{t('privacy.subtitle')}</p>
        </div>
      </div>

      <div className="space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h2 className="text-xl font-semibold text-cyan-400 mb-3">{t('privacy.sec1Title')}</h2>
          <p>{t('privacy.sec1Desc')}</p>
        </section>

        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h2 className="text-xl font-semibold text-cyan-400 mb-3">{t('privacy.sec2Title')}</h2>
          <p>{t('privacy.sec2Desc')}</p>
        </section>

        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h2 className="text-xl font-semibold text-cyan-400 mb-3">{t('privacy.sec3Title')}</h2>
          <p className="mb-3">{t('privacy.sec3Desc')}</p>
          <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2">
            <li>{t('privacy.sec3Item1')}</li>
            <li>{t('privacy.sec3Item2')}</li>
            <li>{t('privacy.sec3Item3')}</li>
          </ul>
        </section>

        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h2 className="text-xl font-semibold text-cyan-400 mb-3">{t('privacy.sec4Title')}</h2>
          <p>{t('privacy.sec4Desc')}</p>
        </section>

        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h2 className="text-xl font-semibold text-cyan-400 mb-3">{t('privacy.sec5Title')}</h2>
          <p>{t('privacy.sec5Desc')}</p>
        </section>
      </div>
    </div>
  );
}

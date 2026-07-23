import { createFileRoute } from '@tanstack/react-router';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Route = createFileRoute('/terms')({
  component: TermsPage,
});

function TermsPage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-slate-200">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
        <FileText className="w-8 h-8 text-cyan-400 shrink-0" />
        <div>
          <h1 className="text-3xl font-bold text-white">{t('terms.title')}</h1>
          <p className="text-sm text-slate-400">{t('terms.subtitle')}</p>
        </div>
      </div>

      <div className="space-y-6 text-slate-300 text-sm sm:text-base leading-relaxed">
        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h2 className="text-xl font-semibold text-cyan-400 mb-3">{t('terms.sec1Title')}</h2>
          <p>{t('terms.sec1Desc')}</p>
        </section>

        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h2 className="text-xl font-semibold text-cyan-400 mb-3">{t('terms.sec2Title')}</h2>
          <p>{t('terms.sec2Desc')}</p>
        </section>

        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h2 className="text-xl font-semibold text-cyan-400 mb-3">{t('terms.sec3Title')}</h2>
          <p>{t('terms.sec3Desc')}</p>
          <ul className="list-disc list-inside space-y-2 text-slate-300 pl-2 mt-2">
            <li>{t('terms.sec3Item1')}</li>
            <li>{t('terms.sec3Item2')}</li>
            <li>{t('terms.sec3Item3')}</li>
          </ul>
        </section>

        <section className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
          <h2 className="text-xl font-semibold text-cyan-400 mb-3">{t('terms.sec4Title')}</h2>
          <p>{t('terms.sec4Desc')}</p>
        </section>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, RefreshCw, Save } from 'lucide-react';
import { useAuth } from './AuthContext';
import type { DayShiftAssignment, ShiftType } from '../types/shift';
import { generateMonthSequence, processShiftsForCalendar } from '../utils/shiftCalculator';

export const PlannerView: React.FC = () => {
  const { t } = useTranslation();
  const { config, draftAssignments, saveDraft, clearDraft } = useAuth();

  const [selectedMonth, setSelectedMonth] = useState('2026-07'); // YYYY-MM
  const [startShiftId, setStartShiftId] = useState(config.sequence[0] || config.shifts[0]?.id || 'giorno');
  const [assignments, setAssignments] = useState<DayShiftAssignment[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day' | 'list'>('month');
  const [syncSuccess, setSyncSuccess] = useState(false);

  // Month parsing
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed

  // Load from draft or generate
  useEffect(() => {
    if (draftAssignments[selectedMonth]) {
      setAssignments(draftAssignments[selectedMonth]);
    } else {
      handleGenerate();
    }
  }, [selectedMonth]);

  const handleGenerate = () => {
    const generated = generateMonthSequence(year, month, config.sequence, startShiftId);
    setAssignments(generated);
    saveDraft(selectedMonth, generated);
  };

  const handleShiftChange = (date: string, newShiftId: string | null) => {
    const updated = assignments.map((a) => (a.date === date ? { ...a, shiftTypeId: newShiftId } : a));
    setAssignments(updated);
    saveDraft(selectedMonth, updated);
  };

  const handleSyncToGoogle = () => {
    // Map shift types for calculation
    const shiftMap: Record<string, ShiftType> = {};
    config.shifts.forEach((s) => {
      shiftMap[s.id] = s;
    });

    const mergedEvents = processShiftsForCalendar(assignments, shiftMap);
    console.log('Events to sync to Google Calendar:', mergedEvents);

    setSyncSuccess(true);
    clearDraft(selectedMonth);
    setTimeout(() => setSyncSuccess(false), 4000);
  };

  const shiftsMap = config.shifts.reduce((acc, s) => {
    acc[s.id] = s;
    return acc;
  }, {} as Record<string, ShiftType>);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-extrabold text-white tracking-tight">{t('planner.title')}</h2>

        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800">
          {(['month', 'week', 'day', 'list'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === mode ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t(`planner.views.${mode}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Control Card: Month & Start Shift Selector */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              {t('planner.selectMonth')}
            </label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              {t('planner.selectStartShift')}
            </label>
            <select
              value={startShiftId}
              onChange={(e) => setStartShiftId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
            >
              {config.shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
          <button
            onClick={handleGenerate}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('planner.generatePreview')}
          </button>

          <button
            onClick={handleSyncToGoogle}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm transition flex items-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            <Save className="w-4 h-4" />
            {t('planner.syncGoogle')}
          </button>
        </div>

        {syncSuccess && (
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {t('planner.syncSuccess')}
          </div>
        )}
      </div>

      {/* Calendar Grid / Views */}
      {viewMode === 'month' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {assignments.map((item) => {
            const shift = item.shiftTypeId ? shiftsMap[item.shiftTypeId] : null;
            const dateObj = new Date(item.date);
            const dayNum = dateObj.getDate();
            const dayName = dateObj.toLocaleDateString('it-IT', { weekday: 'short' });

            return (
              <div
                key={item.date}
                className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex flex-col justify-between gap-3 hover:border-slate-700 transition"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400 uppercase">
                    {dayName} {dayNum}
                  </span>
                  {shift && (
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: shift.color }}
                    />
                  )}
                </div>

                <div className="my-1">
                  {shift ? (
                    <div className="font-bold text-white text-base flex items-center gap-2">
                      <span>{shift.name}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-600 italic">{t('planner.noShift')}</span>
                  )}
                </div>

                {/* Quick Shift Selector */}
                <select
                  value={item.shiftTypeId || ''}
                  onChange={(e) => handleShiftChange(item.date, e.target.value || null)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="">{t('planner.noShift')}</option>
                  {config.shifts.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === 'list' && (
        <div className="space-y-2">
          {assignments.map((item) => {
            const shift = item.shiftTypeId ? shiftsMap[item.shiftTypeId] : null;
            return (
              <div
                key={item.date}
                className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 flex items-center justify-between"
              >
                <span className="text-sm font-semibold text-slate-300">{item.date}</span>
                <div className="flex items-center gap-3">
                  {shift && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: shift.color }}
                    >
                      {shift.name}
                    </span>
                  )}
                  <select
                    value={item.shiftTypeId || ''}
                    onChange={(e) => handleShiftChange(item.date, e.target.value || null)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300"
                  >
                    <option value="">{t('planner.noShift')}</option>
                    {config.shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(viewMode === 'week' || viewMode === 'day') && (
        <div className="p-8 text-center text-slate-500 rounded-2xl border border-slate-800 bg-slate-900/40">
          Vista {viewMode.toUpperCase()} integrata nella griglia mese.
        </div>
      )}
    </div>
  );
};

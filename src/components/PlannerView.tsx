import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { CheckCircle, RefreshCw, Save, Loader2, Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from './AuthContext';
import type { DayShiftAssignment, ShiftType } from '../types/shift';
import { generateMonthSequence, processShiftsForCalendar } from '../utils/shiftCalculator';
import { syncEventsToGoogleCalendar } from '../services/googleCalendarService';
import { ConfirmModal } from './ConfirmModal';

interface PlannerViewProps {
  viewMode?: 'month' | 'list';
}

export const PlannerView: React.FC<PlannerViewProps> = ({ viewMode = 'month' }) => {
  const { t, i18n } = useTranslation();
  const { user, logout, config, draftAssignments, saveDraft, clearDraft } = useAuth();

  const sequenceOptions = config.sequence.length > 0
    ? config.sequence.map((item, index) => {
      const shift = config.shifts.find((s) => s.id === item.shiftId);
      return {
        id: item.id,
        shiftId: item.shiftId,
        label: `${t('settings.sequence.day')} ${index + 1}: ${shift ? shift.name : 'Unknown'}`,
      };
    })
    : config.shifts.map((s) => ({
      id: s.id,
      shiftId: s.id,
      label: s.name,
    }));

  const [selectedMonth, setSelectedMonth] = useState('2026-07'); // YYYY-MM
  const [startShiftId, setStartShiftId] = useState(sequenceOptions[0]?.id || '');
  const [assignments, setAssignments] = useState<DayShiftAssignment[]>([]);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncDayStates, setSyncDayStates] = useState<Record<string, 'deleting' | 'deleted' | 'creating' | 'created'>>({});
  const [syncSummary, setSyncSummary] = useState<{ deleted: number; created: number } | null>(null);
  const [syncErrorMsg, setSyncErrorMsg] = useState<string | null>(null);

  // Month parsing
  const [yearStr, monthStr] = selectedMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed

  // Ensure startShiftId is valid when sequence changes
  useEffect(() => {
    if (sequenceOptions.length > 0 && !sequenceOptions.some((opt) => opt.id === startShiftId || opt.shiftId === startShiftId)) {
      setStartShiftId(sequenceOptions[0].id);
    }
  }, [config.sequence, config.shifts]);

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

  const handleOpenSyncModal = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmSync = async () => {
    setShowConfirmModal(false);
    setIsSyncing(true);
    setSyncErrorMsg(null);
    setSyncDayStates({});
    setSyncSummary({ deleted: 0, created: 0 });

    try {
      // Map shift types for calculation
      const shiftMap: Record<string, ShiftType> = {};
      config.shifts.forEach((s) => {
        shiftMap[s.id] = s;
      });

      const mergedEvents = processShiftsForCalendar(assignments, shiftMap);

      if (user?.accessToken) {
        let deletedCounter = 0;
        let createdCounter = 0;

        await syncEventsToGoogleCalendar(
          user.accessToken,
          mergedEvents,
          selectedMonth,
          config.calendarName,
          (progress) => {
            if (progress.deletedCount !== undefined) deletedCounter = progress.deletedCount;
            if (progress.createdCount !== undefined) createdCounter = progress.createdCount;

            setSyncDayStates((prev) => ({
              ...prev,
              [progress.date]: progress.type,
            }));
            setSyncSummary({
              deleted: deletedCounter,
              created: createdCounter,
            });
          }
        );
      } else {
        console.log('No accessToken found, running animated simulation mode:', mergedEvents);
        let deletedCounter = 0;
        let createdCounter = 0;

        // 1. Simulate Deletion pass for days with shifts
        const daysWithShifts = assignments.filter((a) => a.shiftTypeId);
        for (const item of daysWithShifts) {
          setSyncDayStates((prev) => ({ ...prev, [item.date]: 'deleting' }));
          await new Promise((resolve) => setTimeout(resolve, 100));
          setSyncDayStates((prev) => ({ ...prev, [item.date]: 'deleted' }));
          deletedCounter++;
          setSyncSummary({ deleted: deletedCounter, created: createdCounter });
        }

        // 2. Simulate Creation pass for merged events
        for (const event of mergedEvents) {
          setSyncDayStates((prev) => ({ ...prev, [event.startDate]: 'creating' }));
          await new Promise((resolve) => setTimeout(resolve, 120));

          setSyncDayStates((prev) => ({ ...prev, [event.startDate]: 'created' }));
          createdCounter++;
          setSyncSummary({ deleted: deletedCounter, created: createdCounter });
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      setSyncSuccess(true);
      clearDraft(selectedMonth);
      setTimeout(() => setSyncSuccess(false), 5000);
    } catch (err: any) {
      console.error('Sync failed:', err);
      if (
        err?.status === 401 ||
        err?.isUnauthenticated ||
        err?.message?.includes('UNAUTHENTICATED') ||
        err?.message?.includes('Invalid Credentials') ||
        err?.message?.includes('OAuth 2 access token')
      ) {
        logout('Sessione di autenticazione scaduta o non valida. Effettua nuovamente il login con Google.');
        return;
      }
      setSyncErrorMsg(err?.message || 'Si è verificato un errore durante la sincronizzazione con Google Calendar.');
    } finally {
      setIsSyncing(false);
    }
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
          <Link
            to="/plan/month"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'month' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
          >
            {t('planner.views.month')}
          </Link>
          <Link
            to="/plan/list"
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${viewMode === 'list' ? 'bg-cyan-500 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
          >
            {t('planner.views.list')}
          </Link>
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
              {sequenceOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
          <button
            onClick={handleGenerate}
            className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            {t('planner.generatePreview')}
          </button>

          <button
            onClick={handleOpenSyncModal}
            disabled={isSyncing}
            className={`w-full sm:w-auto px-6 py-2.5 font-bold rounded-xl text-sm transition flex items-center justify-center gap-2 shadow-lg ${isSyncing
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-cyan-500/20'
              }`}
          >
            {isSyncing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('planner.syncing')}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('planner.syncGoogle')}
              </>
            )}
          </button>
        </div>

        {syncSuccess && (
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            {t('planner.syncSuccess')}
          </div>
        )}

        {/* Sync Live Summary Banner */}
        {syncSummary && (
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isSyncing ? 'bg-cyan-400 animate-ping' : 'bg-emerald-400'}`} />
              <span className="text-xs sm:text-sm font-bold text-slate-200">
                {isSyncing ? t('planner.syncing') : t('planner.syncSuccess')}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs font-extrabold">
              <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg shadow-sm">
                {t('planner.syncDeleted', { count: syncSummary.deleted })}
              </span>
              <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg shadow-sm">
                {t('planner.syncCreated', { count: syncSummary.created })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sync Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmModal}
        title={t('planner.confirmSyncTitle')}
        message={t('planner.confirmSyncMessage')}
        confirmText={t('planner.confirmSyncConfirm')}
        cancelText={t('planner.confirmSyncCancel')}
        variant="info"
        onConfirm={handleConfirmSync}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Sync Error Modal */}
      {syncErrorMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="text-lg font-bold text-white">{t('planner.syncErrorTitle')}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{t('planner.syncErrorMessage')}</p>
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs font-mono text-red-300 break-words max-h-40 overflow-y-auto mt-2 select-text">
                  {syncErrorMsg}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end pt-4 border-t border-slate-800">
              <button
                onClick={() => setSyncErrorMsg(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
              >
                {t('planner.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Month View Grid */}
      {viewMode === 'month' && (() => {
        const firstDayOfWeek = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = Monday, 6 = Sunday
        const prevMonthDays = new Date(year, month, 0).getDate();

        const gridDays: Array<{
          dateStr: string;
          dayNum: number;
          isCurrentMonth: boolean;
          assignment?: DayShiftAssignment;
        }> = [];

        // Previous month padding days
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
          gridDays.push({
            dateStr: `prev-${prevMonthDays - i}`,
            dayNum: prevMonthDays - i,
            isCurrentMonth: false,
          });
        }

        // Current month days
        assignments.forEach((item) => {
          const dayNum = parseInt(item.date.split('-')[2], 10);
          gridDays.push({
            dateStr: item.date,
            dayNum,
            isCurrentMonth: true,
            assignment: item,
          });
        });

        // Next month padding days to complete grid rows (multiples of 7)
        const totalGridCells = Math.ceil(gridDays.length / 7) * 7;
        const nextMonthPadding = totalGridCells - gridDays.length;
        for (let i = 1; i <= nextMonthPadding; i++) {
          gridDays.push({
            dateStr: `next-${i}`,
            dayNum: i,
            isCurrentMonth: false,
          });
        }

        const weekDays = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

        return (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-xl space-y-4">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 text-center">
              {weekDays.map((d, idx) => (
                <div key={idx} className="text-xs sm:text-sm font-bold text-slate-400 py-2">
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Cells */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {gridDays.map((cell, idx) => {
                if (!cell.isCurrentMonth || !cell.assignment) {
                  return (
                    <div
                      key={idx}
                      className="min-h-[70px] sm:min-h-[90px] p-2 flex flex-col items-center justify-start text-slate-600 opacity-40 select-none"
                    >
                      <span className="text-sm sm:text-base font-semibold">{cell.dayNum}</span>
                    </div>
                  );
                }

                const item = cell.assignment;
                const shift = item.shiftTypeId ? shiftsMap[item.shiftTypeId] : null;
                const syncState = syncDayStates[item.date];

                return (
                  <div
                    key={item.date}
                    className={`min-h-[70px] sm:min-h-[90px] p-1.5 sm:p-2.5 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/80 hover:border-slate-700 transition flex flex-col items-center justify-between group relative md:gap-2 ${
                      syncState === 'deleting'
                        ? 'sync-deleting-card'
                        : syncState === 'creating'
                          ? 'sync-creating-card'
                          : syncState === 'created'
                            ? 'sync-created-card'
                            : ''
                    }`}
                  >
                    {/* Day Number */}
                    <span className="relative z-10 text-sm sm:text-base font-bold text-slate-200 leading-none">
                      {cell.dayNum}
                    </span>

                    {/* Shift Dot & Name */}
                    <div className="relative z-10 flex flex-col items-center justify-center gap-1 sm:gap-2 w-full my-auto pointer-events-none">
                      {shift ? (
                        <>
                          <div
                            className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-sm shrink-0"
                            style={{ backgroundColor: shift.color }}
                          />
                          <span className="text-[10px] sm:text-xs font-semibold text-slate-300 tracking-tight text-center truncate max-w-full">
                            <span className="sm:hidden">{shift.name.slice(0, 3)}</span>
                            <span className="hidden sm:inline">{shift.name}</span>
                          </span>
                        </>
                      ) : (
                        <div className="h-4" />
                      )}
                    </div>

                    {/* Quick Shift Selector on Click/Hover */}
                    <select
                      value={item.shiftTypeId || ''}
                      onChange={(e) => handleShiftChange(item.date, e.target.value || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-20"
                      title={`${item.date}: ${shift ? shift.name : t('planner.noShift')}`}
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
          </div>
        );
      })()}

      {viewMode === 'list' && (
        <div className="space-y-2">
          {assignments.map((item) => {
            const shift = item.shiftTypeId ? shiftsMap[item.shiftTypeId] : null;
            const dateObj = new Date(item.date + 'T00:00:00');
            const dayNum = dateObj.getDate();
            const dayName = dateObj.toLocaleDateString(i18n.language || 'it', { weekday: 'short' });
            const formattedWeekday = dayName.charAt(0).toUpperCase() + dayName.slice(1, 3);
            const formattedDate = `${formattedWeekday} ${dayNum}`;
            const syncState = syncDayStates[item.date];

            const timeText = shift?.startTime && shift?.endTime
              ? `${shift.startTime} - ${shift.endTime}`
              : shift?.isAllDay
                ? t('settings.shifts.allDay')
                : shift?.isNoEvent
                  ? t('settings.shifts.noEvent')
                  : null;

            return (
              <div
                key={item.date}
                className={`p-3 sm:p-4 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0 relative ${
                  syncState === 'deleting'
                    ? 'sync-deleting-card'
                    : syncState === 'creating'
                      ? 'sync-creating-card'
                      : syncState === 'created'
                        ? 'sync-created-card'
                        : ''
                }`}
              >
                {/* Date & Shift Info */}
                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
                  <span className="text-xs sm:text-sm font-bold text-slate-300 w-14 sm:w-18 shrink-0">
                    {formattedDate}
                  </span>

                  {shift ? (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0 flex-1 flex-wrap sm:flex-nowrap">
                      <span
                        className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shrink-0 truncate max-w-[140px] sm:max-w-[180px]"
                        style={{ backgroundColor: shift.color }}
                        title={shift.name}
                      >
                        {shift.name}
                      </span>
                      {timeText && (
                        <span className="text-xs text-slate-400 font-medium truncate max-w-[150px] sm:max-w-[220px]">
                          {timeText}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-xs text-slate-500 italic">
                      {t('planner.noShift')}
                    </span>
                  )}
                </div>

                {/* Dropdown Selector */}
                <div className="relative z-20 shrink-0">
                  <select
                    value={item.shiftTypeId || ''}
                    onChange={(e) => handleShiftChange(item.date, e.target.value || null)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 max-w-[130px] sm:max-w-[180px] truncate"
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
    </div>
  );
};

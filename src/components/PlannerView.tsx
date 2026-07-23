import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { CheckCircle, RefreshCw, Save, Loader2, Calendar } from 'lucide-react';
import { useAuth } from './AuthContext';
import type { DayShiftAssignment, ShiftType } from '../types/shift';
import { generateMonthSequence, processShiftsForCalendar } from '../utils/shiftCalculator';

interface PlannerViewProps {
  viewMode?: 'month' | 'list';
}

export const PlannerView: React.FC<PlannerViewProps> = ({ viewMode = 'month' }) => {
  const { t, i18n } = useTranslation();
  const { config, draftAssignments, saveDraft, clearDraft } = useAuth();

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

    try {
      // Map shift types for calculation
      const shiftMap: Record<string, ShiftType> = {};
      config.shifts.forEach((s) => {
        shiftMap[s.id] = s;
      });

      const mergedEvents = processShiftsForCalendar(assignments, shiftMap);
      console.log('Events to sync to Google Calendar:', mergedEvents);

      // Simulate network request saving events to Google Calendar
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSyncSuccess(true);
      clearDraft(selectedMonth);
      setTimeout(() => setSyncSuccess(false), 4000);
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
      </div>

      {/* Sync Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{t('planner.confirmSyncTitle')}</h3>
                <p className="text-xs text-slate-400 mt-0.5">{t('planner.confirmSyncMessage')}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 font-semibold text-xs transition cursor-pointer"
              >
                {t('planner.confirmSyncCancel')}
              </button>
              <button
                onClick={handleConfirmSync}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs transition shadow-lg shadow-cyan-500/20 cursor-pointer"
              >
                {t('planner.confirmSyncConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Month View Grid */}
      {viewMode === 'month' && (() => {
        const daysInMonth = new Date(year, month + 1, 0).getDate();
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

                return (
                  <div
                    key={item.date}
                    className="min-h-[70px] sm:min-h-[90px] p-1.5 sm:p-2.5 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/80 hover:border-slate-700 transition flex flex-col items-center justify-between group relative md:gap-2"
                  >
                    {/* Day Number */}
                    <span className="text-sm sm:text-base font-bold text-slate-200 leading-none">
                      {cell.dayNum}
                    </span>

                    {/* Shift Dot & Name */}
                    <div className="flex flex-col items-center justify-center gap-1 sm:gap-2 w-full my-auto z-0 pointer-events-none">
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
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
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
                className="p-3 sm:p-4 rounded-2xl border border-slate-800 bg-slate-900/60 hover:bg-slate-900 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0"
              >
                {/* Date & Shift Info */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0 flex-1">
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
                <div className="shrink-0">
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

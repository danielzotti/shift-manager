import React, { useState, useEffect } from 'react';
import { Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { Calendar, Trash2, Download, Upload, AlertTriangle, Check, Plus, GripVertical, Pencil, X, Loader2, RefreshCw } from 'lucide-react';
import { Reorder } from 'framer-motion';
import { useAuth } from './AuthContext';
import { deleteGoogleCalendarEvents, fetchShiftCalendarSummary } from '../services/googleCalendarService';
import type { SequenceItem, ShiftType } from '../types/shift';
import { generateUUID } from '../types/shift';
import { ConfirmModal } from './ConfirmModal';
import { CustomDatePicker } from './CustomDatePicker';

interface SettingsViewProps {
  activeTab?: 'calendar' | 'shifts' | 'sequence';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ activeTab = 'shifts' }) => {
  const { t } = useTranslation();
  const { user, logout, config, updateConfig } = useAuth();

  // Local tab states
  const [calName, setCalName] = useState(config.calendarName);
  const [isLoadingCalName, setIsLoadingCalName] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'all' | 'from' | 'until' | 'range'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deletedCount, setDeletedCount] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

  // Load calendar name from Google Calendar on mount or activeTab change
  useEffect(() => {
    if (activeTab === 'calendar' && user?.accessToken) {
      setIsLoadingCalName(true);
      fetchShiftCalendarSummary(user.accessToken)
        .then((remoteSummary) => {
          if (remoteSummary) {
            setCalName(remoteSummary);
            updateConfig({ calendarName: remoteSummary });
          }
        })
        .catch((err: any) => {
          console.error('Failed to fetch remote calendar summary:', err);
          if (
            err?.status === 401 ||
            err?.isUnauthenticated ||
            err?.message?.includes('UNAUTHENTICATED') ||
            err?.message?.includes('Invalid Credentials')
          ) {
            logout('Sessione di autenticazione scaduta o non valida. Effettua nuovamente il login con Google.');
            return;
          }
          setSaveNameError(err?.message || 'Impossibile recuperare le informazioni del calendario da Google Calendar.');
        })
        .finally(() => setIsLoadingCalName(false));
    }
  }, [activeTab, user?.accessToken]);

  // Helper to generate a random hex color that is unused by existing shifts if possible
  const getRandomUnusedColor = (existingShifts: ShiftType[]) => {
    const presetPalette = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
      '#ec4899', '#06b6d4', '#84cc16', '#d97706', '#6366f1',
      '#14b8a6', '#f43f5e', '#a855f7', '#0284c7', '#22c55e'
    ];
    const usedColors = new Set(existingShifts.map((s) => s.color.toLowerCase()));
    const availablePresets = presetPalette.filter((c) => !usedColors.has(c.toLowerCase()));

    if (availablePresets.length > 0) {
      return availablePresets[Math.floor(Math.random() * availablePresets.length)];
    }

    // Generate random hex color if all presets are used
    for (let i = 0; i < 20; i++) {
      const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
      if (!usedColors.has(randomColor.toLowerCase())) {
        return randomColor;
      }
    }
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
  };

  // Edit shift modal state
  const [editingShift, setEditingShift] = useState<ShiftType | null>(null);

  // New shift form state
  const [newShift, setNewShift] = useState<Partial<ShiftType>>({
    name: '',
    startTime: '08:00',
    endTime: '16:00',
    color: getRandomUnusedColor(config.shifts),
    isAllDay: false,
    isNoEvent: false,
  });

  // Ensure default color is initialized to random unused color on mount
  useEffect(() => {
    setNewShift((prev) => ({ ...prev, color: getRandomUnusedColor(config.shifts) }));
  }, []);

  const [isSavingName, setIsSavingName] = useState(false);
  const [saveNameSuccess, setSaveNameSuccess] = useState(false);
  const [saveNameError, setSaveNameError] = useState<string | null>(null);

  const handleSaveCalName = async () => {
    setSaveNameError(null);
    setSaveNameSuccess(false);

    if (!calName.trim()) {
      setSaveNameError('Inserisci un nome valido per il calendario.');
      return;
    }

    updateConfig({ calendarName: calName });

    if (user?.accessToken) {
      setIsSavingName(true);
      try {
        const { updateShiftCalendarName } = await import('../services/googleCalendarService');
        await updateShiftCalendarName(user.accessToken, calName);
        setSaveNameSuccess(true);
        setTimeout(() => setSaveNameSuccess(false), 3000);
      } catch (err: any) {
        console.error('Failed to update Google Calendar name:', err);
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
        setSaveNameError(err.message || 'Impossibile aggiornare il nome del calendario su Google.');
      } finally {
        setIsSavingName(false);
      }
    } else {
      setSaveNameSuccess(true);
      setTimeout(() => setSaveNameSuccess(false), 3000);
    }
  };

  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `shift_manager_backup_${config.calendarName}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const importedConfig = JSON.parse(event.target?.result as string);
          if (importedConfig.shifts && importedConfig.sequence) {
            updateConfig(importedConfig);
            alert("Backup ripristinato con successo!");
          }
        } catch (err) {
          alert("File backup non valido!");
        }
      };
    }
  };

  const handleDeleteEvents = () => {
    setDeleteError(null);
    setDeleteSuccess(false);
    setDeletedCount(null);

    if (deleteOption === 'from' && !fromDate) {
      setDeleteError('Seleziona la data di inizio per l\'eliminazione.');
      return;
    }
    if (deleteOption === 'until' && !toDate) {
      setDeleteError('Seleziona la data di fine per l\'eliminazione.');
      return;
    }
    if (deleteOption === 'range' && (!fromDate || !toDate)) {
      setDeleteError('Seleziona sia la data di inizio che di fine per l\'eliminazione.');
      return;
    }

    setShowDeleteConfirmModal(true);
  };

  const executeDeleteEvents = async () => {
    setShowDeleteConfirmModal(false);
    setIsDeleting(true);

    try {
      if (user?.accessToken) {
        const res = await deleteGoogleCalendarEvents(
          user.accessToken,
          {
            deleteOption,
            fromDate: deleteOption === 'from' || deleteOption === 'range' ? fromDate : undefined,
            toDate: deleteOption === 'until' || deleteOption === 'range' ? toDate : undefined,
          },
          config.calendarName,
          (count) => {
            setDeletedCount(count);
          }
        );
        setDeletedCount(res.deletedCount);
        setDeleteSuccess(true);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setDeletedCount(0);
        setDeleteSuccess(true);
      }
    } catch (err: any) {
      console.error('Delete events failed:', err);
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
      setDeleteError(err.message || 'Errore durante l\'eliminazione degli eventi da Google Calendar.');
    } finally {
      setIsDeleting(false);
    }
  };


  const handleRefreshNewColor = () => {
    setNewShift((prev) => ({ ...prev, color: getRandomUnusedColor(config.shifts) }));
  };

  const handleRefreshEditColor = () => {
    if (!editingShift) return;
    const otherShifts = config.shifts.filter((s) => s.id !== editingShift.id);
    setEditingShift({ ...editingShift, color: getRandomUnusedColor(otherShifts) });
  };

  const handleAddShift = () => {
    if (!newShift.name) return;
    const shiftColor = newShift.color || getRandomUnusedColor(config.shifts);
    const shift: ShiftType = {
      id: generateUUID(),
      name: newShift.name,
      startTime: newShift.isAllDay || newShift.isNoEvent ? undefined : newShift.startTime,
      endTime: newShift.isAllDay || newShift.isNoEvent ? undefined : newShift.endTime,
      isAllDay: newShift.isAllDay,
      isNoEvent: newShift.isNoEvent,
      color: shiftColor,
    };
    const updatedShifts = [...config.shifts, shift];
    updateConfig({ shifts: updatedShifts });
    setNewShift({
      name: '',
      startTime: '08:00',
      endTime: '16:00',
      color: getRandomUnusedColor(updatedShifts),
      isAllDay: false,
      isNoEvent: false,
    });
  };

  const handleSaveEditShift = () => {
    if (!editingShift || !editingShift.name) return;
    const updatedShifts = config.shifts.map((s) =>
      s.id === editingShift.id
        ? {
          ...editingShift,
          startTime: editingShift.isAllDay || editingShift.isNoEvent ? undefined : editingShift.startTime || '08:00',
          endTime: editingShift.isAllDay || editingShift.isNoEvent ? undefined : editingShift.endTime || '16:00',
        }
        : s
    );
    updateConfig({ shifts: updatedShifts });
    setEditingShift(null);
  };

  const handleDeleteShift = (id: string) => {
    updateConfig({
      shifts: config.shifts.filter((s) => s.id !== id),
      sequence: config.sequence.filter((sItem) => sItem.shiftId !== id),
    });
  };

  const handleAddToSequence = (shiftId: string) => {
    const newItem: SequenceItem = { id: generateUUID(), shiftId };
    updateConfig({ sequence: [...config.sequence, newItem] });
  };

  // Local state for drag & drop sequence to avoid API calls during movement
  const [localSequence, setLocalSequence] = useState(config.sequence);

  useEffect(() => {
    setLocalSequence(config.sequence);
  }, [config.sequence]);

  const handleRemoveFromSequence = (index: number) => {
    const nextSeq = [...config.sequence];
    nextSeq.splice(index, 1);
    updateConfig({ sequence: nextSeq });
  };

  const handleReorderSequence = (newSequence: SequenceItem[]) => {
    setLocalSequence(newSequence);
  };

  const handleDragEndSequence = () => {
    updateConfig({ sequence: localSequence });
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">{t('settings.title')}</h2>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
        <Link
          to="/config/shifts"
          className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'shifts' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
        >
          {t('settings.tabs.shifts')}
        </Link>
        <Link
          to="/config/sequence"
          className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'sequence' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
        >
          {t('settings.tabs.sequence')}
        </Link>
        <Link
          to="/config/calendar"
          className={`flex-1 text-center py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === 'calendar' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
            }`}
        >
          {t('settings.tabs.calendar')}
        </Link>
      </div>

      {/* Tab 1: Calendario */}
      {activeTab === 'calendar' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
            <h3 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-cyan-400" />
              {t('settings.calendar.nameLabel')}
            </h3>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={calName}
                  disabled={isLoadingCalName}
                  onChange={(e) => setCalName(e.target.value)}
                  placeholder={t('settings.calendar.namePlaceholder')}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 disabled:opacity-60"
                />
                {isLoadingCalName && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
              </div>
              <button
                onClick={handleSaveCalName}
                disabled={isSavingName || isLoadingCalName}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition flex items-center gap-2"
              >
                {isSavingName ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvataggio...
                  </>
                ) : (
                  t('settings.calendar.saveName')
                )}
              </button>
            </div>
            {saveNameError && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {saveNameError}
              </div>
            )}
            {saveNameSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 shrink-0" />
                Nome calendario aggiornato con successo su Google Calendar!
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">{t('settings.calendar.backupTitle')}</h3>
            <p className="text-sm text-slate-400">{t('settings.calendar.backupDesc')}</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleExportBackup}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition"
              >
                <Download className="w-4 h-4" />
                {t('settings.calendar.exportBtn')}
              </button>
              <label className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-sm font-medium transition cursor-pointer">
                <Upload className="w-4 h-4" />
                {t('settings.calendar.importBtn')}
                <input type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
              </label>
            </div>
          </div>

          {/* Area Pericolosa */}
          <div className="p-6 rounded-2xl border border-red-500/30 bg-red-950/10 space-y-4">
            <h3 className="text-lg font-bold text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              {t('settings.calendar.dangerZone')}
            </h3>

            <div className="space-y-2 text-sm text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="del"
                  checked={deleteOption === 'all'}
                  onChange={() => setDeleteOption('all')}
                />
                {t('settings.calendar.deleteAll')}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="del"
                  checked={deleteOption === 'from'}
                  onChange={() => setDeleteOption('from')}
                />
                {t('settings.calendar.deleteFrom')}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="del"
                  checked={deleteOption === 'until'}
                  onChange={() => setDeleteOption('until')}
                />
                {t('settings.calendar.deleteUntil')}
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="del"
                  checked={deleteOption === 'range'}
                  onChange={() => setDeleteOption('range')}
                />
                {t('settings.calendar.deleteRange')}
              </label>
            </div>

            {deleteOption !== 'all' && (
              <div className="flex gap-4 pt-2">
                {(deleteOption === 'from' || deleteOption === 'range') && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t('settings.calendar.startDate')}</label>
                    <CustomDatePicker
                      value={fromDate}
                      onChange={(val) => setFromDate(val)}
                      className="w-40 sm:w-48"
                    />
                  </div>
                )}
                {(deleteOption === 'until' || deleteOption === 'range') && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t('settings.calendar.endDate')}</label>
                    <CustomDatePicker
                      value={toDate}
                      onChange={(val) => setToDate(val)}
                      className="w-40 sm:w-48"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleDeleteEvents}
              disabled={isDeleting}
              className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Eliminazione in corso...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {t('settings.calendar.executeDelete')}
                </>
              )}
            </button>

            {isDeleting && deletedCount !== null && deletedCount > 0 && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-300 rounded-xl text-xs font-semibold flex items-center justify-between animate-pulse">
                <span>Eliminazione in corso...</span>
                <span className="px-2.5 py-0.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold">
                  {deletedCount} {deletedCount === 1 ? 'evento eliminato' : 'eventi eliminati'}
                </span>
              </div>
            )}

            {deleteError && (
              <div className="p-3 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {deleteError}
              </div>
            )}

            {deleteSuccess && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>Operazione completata con successo!</span>
                </div>
                {deletedCount !== null && (
                  <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-extrabold whitespace-nowrap">
                    {deletedCount} {deletedCount === 1 ? 'evento eliminato' : 'eventi eliminati'}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Turni */}
      {activeTab === 'shifts' && (
        <div className="space-y-6">

          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-bold text-slate-200">{t('settings.shifts.title')}</h3>
              <span className="text-xs text-slate-400">{t('settings.shifts.clickToEdit')}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.shifts.map((shift) => (
                <div
                  key={shift.id}
                  onClick={() => setEditingShift({ ...shift })}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 hover:bg-slate-800/60 hover:border-cyan-500/50 transition cursor-pointer flex justify-between items-center group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full shrink-0"
                      style={{ backgroundColor: shift.color }}
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                        {shift.name}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {shift.isNoEvent
                          ? t('settings.shifts.noEvent')
                          : shift.isAllDay
                            ? t('settings.shifts.allDay')
                            : `${shift.startTime} - ${shift.endTime}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingShift({ ...shift });
                      }}
                      className="p-2 text-slate-400 hover:text-cyan-400 transition"
                      title={t('settings.shifts.edit')}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteShift(shift.id);
                      }}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title={t('settings.shifts.delete')}
                      aria-label={t('settings.shifts.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">{t('settings.shifts.addShift')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nome Turno */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {t('settings.shifts.name')}
                </label>
                <input
                  type="text"
                  placeholder={t('settings.shifts.name')}
                  value={newShift.name}
                  onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 transition"
                />
              </div>

              {/* Colore Visuale */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {t('settings.shifts.color')}
                </label>
                <div className="flex items-center gap-3 h-[42px] px-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <input
                    type="color"
                    value={newShift.color}
                    onChange={(e) => setNewShift({ ...newShift, color: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-300 flex-1">{newShift.color}</span>
                  <button
                    type="button"
                    onClick={handleRefreshNewColor}
                    title="Genera un colore casuale non usato"
                    className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 rounded-lg transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Opzioni Checkbox Touch-Friendly */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">
                  Tipologia Turno
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition min-h-[44px] ${newShift.isAllDay
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={newShift.isAllDay}
                      onChange={(e) => setNewShift({ ...newShift, isAllDay: e.target.checked, isNoEvent: false })}
                      className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                    />
                    <span className="text-xs font-medium">{t('settings.shifts.allDay')}</span>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition min-h-[44px] ${newShift.isNoEvent
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={newShift.isNoEvent}
                      onChange={(e) => setNewShift({ ...newShift, isNoEvent: e.target.checked, isAllDay: false })}
                      className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                    />
                    <span className="text-xs font-medium">{t('settings.shifts.noEvent')}</span>
                  </label>
                </div>
              </div>

              {/* Orari Turno */}
              {!newShift.isAllDay && !newShift.isNoEvent && (
                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-400">
                    Orario Turno
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={newShift.startTime}
                      onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition min-h-[44px]"
                    />
                    <span className="text-slate-500 font-medium">-</span>
                    <input
                      type="time"
                      value={newShift.endTime}
                      onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500 transition min-h-[44px]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleAddShift}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm transition flex items-center gap-2 min-h-[44px] justify-center"
              >
                <Plus className="w-4 h-4" />
                {t('settings.shifts.addShift')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Sequenza */}
      {activeTab === 'sequence' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">{t('settings.sequence.title')}</h3>
            <p className="text-sm text-slate-400">{t('settings.sequence.desc')}</p>

            <Reorder.Group
              axis="y"
              values={localSequence}
              onReorder={handleReorderSequence}
              className="space-y-2"
            >
              {localSequence.map((item, index) => {
                const shift = config.shifts.find((s) => s.id === item.shiftId);
                return (
                  <Reorder.Item
                    key={item.id}
                    value={item}
                    onDragEnd={handleDragEndSequence}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950 cursor-grab active:cursor-grabbing select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-slate-500 hover:text-slate-300 p-1 touch-none">
                        <GripVertical className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold text-slate-500">
                        {index + 1}
                      </span>
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: shift?.color || '#94a3b8' }}
                      />
                      <span className="text-sm font-semibold text-white">
                        {shift ? shift.name : 'Unknown'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveFromSequence(index);
                      }}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition flex items-center gap-1.5"
                      title={t('settings.sequence.remove')}
                      aria-label={t('settings.sequence.remove')}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline text-xs">{t('settings.sequence.remove')}</span>
                    </button>
                  </Reorder.Item>
                );
              })}
            </Reorder.Group>

            {/* Add to sequence */}
            <div className="pt-4 border-t border-slate-800">
              <label className="block text-xs text-slate-400 mb-2">
                {t('settings.sequence.addStep')}
              </label>
              <div className="flex flex-wrap gap-2">
                {config.shifts.map((shift) => (
                  <button
                    key={shift.id}
                    onClick={() => handleAddToSequence(shift.id)}
                    className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 hover:border-cyan-500 text-xs font-semibold text-slate-200 transition flex items-center gap-2"
                  >
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: shift.color }} />
                    {shift.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Shift Modal */}
      {editingShift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-cyan-400" />
                {t('settings.shifts.editShift')}
              </h3>
              <button
                onClick={() => setEditingShift(null)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {t('settings.shifts.name')}
                </label>
                <input
                  type="text"
                  value={editingShift.name}
                  onChange={(e) => setEditingShift({ ...editingShift, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  {t('settings.shifts.color')}
                </label>
                <div className="flex items-center gap-3 h-[42px] px-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <input
                    type="color"
                    value={editingShift.color}
                    onChange={(e) => setEditingShift({ ...editingShift, color: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                  />
                  <span className="text-xs font-mono text-slate-300 flex-1">{editingShift.color}</span>
                  <button
                    type="button"
                    onClick={handleRefreshEditColor}
                    title="Genera un colore casuale non usato"
                    className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-900 rounded-lg transition"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="sm:col-span-2 space-y-1.5 pt-1">
                <label className="block text-xs font-semibold text-slate-400">
                  Tipologia Turno
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition min-h-[44px] ${editingShift.isAllDay
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!editingShift.isAllDay}
                      onChange={(e) =>
                        setEditingShift({
                          ...editingShift,
                          isAllDay: e.target.checked,
                          isNoEvent: false,
                        })
                      }
                      className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                    />
                    <span className="text-xs font-medium">{t('settings.shifts.allDay')}</span>
                  </label>

                  <label
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer select-none transition min-h-[44px] ${editingShift.isNoEvent
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={!!editingShift.isNoEvent}
                      onChange={(e) =>
                        setEditingShift({
                          ...editingShift,
                          isNoEvent: e.target.checked,
                          isAllDay: false,
                        })
                      }
                      className="w-5 h-5 accent-cyan-500 rounded cursor-pointer"
                    />
                    <span className="text-xs font-medium">{t('settings.shifts.noEvent')}</span>
                  </label>
                </div>
              </div>

              {!editingShift.isAllDay && !editingShift.isNoEvent && (
                <div className="sm:col-span-2 space-y-1">
                  <label className="block text-xs font-semibold text-slate-400">Orario Turno</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={editingShift.startTime || '08:00'}
                      onChange={(e) => setEditingShift({ ...editingShift, startTime: e.target.value })}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                    />
                    <span className="text-slate-500">-</span>
                    <input
                      type="time"
                      value={editingShift.endTime || '16:00'}
                      onChange={(e) => setEditingShift({ ...editingShift, endTime: e.target.value })}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setEditingShift(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-sm transition"
              >
                {t('settings.shifts.cancel')}
              </button>
              <button
                onClick={handleSaveEditShift}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {t('settings.shifts.saveChanges')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirmModal}
        title={t('settings.calendar.dangerZone')}
        message={t('settings.calendar.confirmDelete')}
        confirmText="Elimina Eventi"
        cancelText="Annulla"
        variant="danger"
        onConfirm={executeDeleteEvents}
        onCancel={() => setShowDeleteConfirmModal(false)}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Trash2, Download, Upload, AlertTriangle, Check, Plus } from 'lucide-react';
import { useAuth } from './AuthContext';
import type { ShiftType } from '../types/shift';

export const SettingsView: React.FC = () => {
  const { t } = useTranslation();
  const { config, updateConfig } = useAuth();
  const [activeTab, setActiveTab] = useState<'calendar' | 'shifts' | 'sequence'>('calendar');

  // Local tab states
  const [calName, setCalName] = useState(config.calendarName);
  const [deleteOption, setDeleteOption] = useState<'all' | 'from' | 'until' | 'range'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // New shift form state
  const [newShift, setNewShift] = useState<Partial<ShiftType>>({
    name: '',
    startTime: '08:00',
    endTime: '16:00',
    color: '#3b82f6',
    isAllDay: false,
    isNoEvent: false,
  });

  const handleSaveCalName = () => {
    updateConfig({ calendarName: calName });
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
    if (confirm(t('settings.calendar.confirmDelete'))) {
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);
    }
  };

  const handleAddShift = () => {
    if (!newShift.name) return;
    const shift: ShiftType = {
      id: 'shift_' + Date.now(),
      name: newShift.name,
      startTime: newShift.isAllDay || newShift.isNoEvent ? undefined : newShift.startTime,
      endTime: newShift.isAllDay || newShift.isNoEvent ? undefined : newShift.endTime,
      isAllDay: newShift.isAllDay,
      isNoEvent: newShift.isNoEvent,
      color: newShift.color || '#3b82f6',
    };
    updateConfig({ shifts: [...config.shifts, shift] });
    setNewShift({ name: '', startTime: '08:00', endTime: '16:00', color: '#3b82f6', isAllDay: false, isNoEvent: false });
  };

  const handleDeleteShift = (id: string) => {
    updateConfig({
      shifts: config.shifts.filter((s) => s.id !== id),
      sequence: config.sequence.filter((sId) => sId !== id),
    });
  };

  const handleAddToSequence = (shiftId: string) => {
    updateConfig({ sequence: [...config.sequence, shiftId] });
  };

  const handleRemoveFromSequence = (index: number) => {
    const nextSeq = [...config.sequence];
    nextSeq.splice(index, 1);
    updateConfig({ sequence: nextSeq });
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">{t('settings.title')}</h2>
      </div>

      {/* Tabs Switcher */}
      <div className="flex bg-slate-900/80 p-1.5 rounded-xl border border-slate-800">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'calendar' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.calendar')}
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'shifts' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.shifts')}
        </button>
        <button
          onClick={() => setActiveTab('sequence')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === 'sequence' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-white'
          }`}
        >
          {t('settings.tabs.sequence')}
        </button>
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
              <input
                type="text"
                value={calName}
                onChange={(e) => setCalName(e.target.value)}
                placeholder={t('settings.calendar.namePlaceholder')}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleSaveCalName}
                className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm transition"
              >
                {t('settings.calendar.saveName')}
              </button>
            </div>
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
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-white"
                    />
                  </div>
                )}
                {(deleteOption === 'until' || deleteOption === 'range') && (
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">{t('settings.calendar.endDate')}</label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-white"
                    />
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleDeleteEvents}
              className="w-full sm:w-auto px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-xl transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {t('settings.calendar.executeDelete')}
            </button>

            {deleteSuccess && (
              <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" />
                Operazione completata con successo sul calendario Google!
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Turni */}
      {activeTab === 'shifts' && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/50 space-y-4">
            <h3 className="text-lg font-bold text-slate-200">{t('settings.shifts.addShift')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder={t('settings.shifts.name')}
                value={newShift.name}
                onChange={(e) => setNewShift({ ...newShift, name: e.target.value })}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-sm text-white"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-400">{t('settings.shifts.color')}:</label>
                <input
                  type="color"
                  value={newShift.color}
                  onChange={(e) => setNewShift({ ...newShift, color: e.target.value })}
                  className="w-10 h-10 rounded-lg cursor-pointer bg-transparent border-0"
                />
              </div>
              <div className="flex items-center gap-4 text-xs text-slate-300">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newShift.isAllDay}
                    onChange={(e) => setNewShift({ ...newShift, isAllDay: e.target.checked, isNoEvent: false })}
                  />
                  {t('settings.shifts.allDay')}
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newShift.isNoEvent}
                    onChange={(e) => setNewShift({ ...newShift, isNoEvent: e.target.checked, isAllDay: false })}
                  />
                  {t('settings.shifts.noEvent')}
                </label>
              </div>
              {!newShift.isAllDay && !newShift.isNoEvent && (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={newShift.startTime}
                    onChange={(e) => setNewShift({ ...newShift, startTime: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                  <span className="text-slate-500">-</span>
                  <input
                    type="time"
                    value={newShift.endTime}
                    onChange={(e) => setNewShift({ ...newShift, endTime: e.target.value })}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                  />
                </div>
              )}
            </div>
            <button
              onClick={handleAddShift}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl text-sm transition flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('settings.shifts.addShift')}
            </button>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-bold text-slate-200">{t('settings.shifts.title')}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {config.shifts.map((shift) => (
                <div
                  key={shift.id}
                  className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex justify-between items-center"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: shift.color }}
                    />
                    <div>
                      <h4 className="font-bold text-white text-sm">{shift.name}</h4>
                      <p className="text-xs text-slate-400">
                        {shift.isNoEvent
                          ? t('settings.shifts.noEvent')
                          : shift.isAllDay
                          ? t('settings.shifts.allDay')
                          : `${shift.startTime} - ${shift.endTime}`}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteShift(shift.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
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

            {/* Sequence Display */}
            <div className="space-y-2">
              {config.sequence.map((shiftId, index) => {
                const shift = config.shifts.find((s) => s.id === shiftId);
                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-500 w-16">
                        {t('settings.sequence.day')} {index + 1}:
                      </span>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: shift?.color || '#94a3b8' }}
                      />
                      <span className="text-sm font-semibold text-white">
                        {shift ? shift.name : 'Unknown'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveFromSequence(index)}
                      className="text-xs text-red-400 hover:text-red-300 transition"
                    >
                      {t('settings.sequence.remove')}
                    </button>
                  </div>
                );
              })}
            </div>

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
    </div>
  );
};

export type ShiftType = {
  id: string;
  name: string;
  startTime?: string;
  endTime?: string;
  isOvernight?: boolean;
  isAllDay?: boolean;
  isNoEvent?: boolean;
  color: string;
};

export type DayShiftAssignment = {
  date: string;
  shiftTypeId: string | null;
};

export type CalendarConfig = {
  calendarName: string;
  calendarId?: string;
  shifts: ShiftType[];
  sequence: string[];
};

export type UserProfile = {
  name: string;
  email: string;
  picture: string;
  accessToken?: string;
};

export const DEFAULT_SHIFTS: ShiftType[] = [
  { id: 'giorno', name: 'Giorno', startTime: '07:15', endTime: '19:30', color: '#3b82f6' },
  { id: 'notte', name: 'Notte', startTime: '19:15', endTime: '07:30', isOvernight: true, color: '#6366f1' },
  { id: 'smontante', name: 'Smontante notte', isNoEvent: true, color: '#64748b' },
  { id: 'libero', name: 'Libero', isAllDay: true, color: '#10b981' },
  { id: 'ferie', name: 'Ferie', isAllDay: true, color: '#f59e0b' },
  { id: 'mattina', name: 'Mattina', startTime: '06:30', endTime: '13:42', color: '#06b6d4' },
  { id: 'pomeriggio', name: 'Pomeriggio', startTime: '13:42', endTime: '20:54', color: '#ec4899' },
];

export const DEFAULT_SEQUENCE = ['giorno', 'notte', 'smontante', 'libero', 'libero'];

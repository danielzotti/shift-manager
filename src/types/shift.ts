export type ShiftType = {
  id: string; // UUID
  name: string;
  startTime?: string;
  endTime?: string;
  isOvernight?: boolean;
  isAllDay?: boolean;
  isNoEvent?: boolean;
  color: string;
};

export type SequenceItem = {
  id: string;      // Unique UUID for sequence element
  shiftId: string; // UUID of associated ShiftType
};

export type DayShiftAssignment = {
  date: string;
  shiftTypeId: string | null;
};

export type CalendarConfig = {
  calendarName: string;
  calendarId?: string;
  shifts: ShiftType[];
  sequence: SequenceItem[];
};

export type UserProfile = {
  name: string;
  email: string;
  picture: string;
  accessToken?: string;
};

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const DEFAULT_SHIFTS: ShiftType[] = [
  { id: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678901', name: 'Giorno', startTime: '07:15', endTime: '19:30', color: '#3b82f6' },
  { id: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678902', name: 'Notte', startTime: '19:15', endTime: '07:30', isOvernight: true, color: '#6366f1' },
  { id: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678903', name: 'Smontante notte', isNoEvent: true, color: '#64748b' },
  { id: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678904', name: 'Libero', isAllDay: true, color: '#10b981' },
  { id: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678905', name: 'Ferie', isAllDay: true, color: '#f59e0b' },
  { id: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678906', name: 'Mattina', startTime: '06:30', endTime: '13:42', color: '#06b6d4' },
  { id: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678907', name: 'Pomeriggio', startTime: '13:42', endTime: '20:54', color: '#ec4899' },
];

export const DEFAULT_SEQUENCE: SequenceItem[] = [
  { id: 'seq-00000000-0000-4000-8000-000000000001', shiftId: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678901' },
  { id: 'seq-00000000-0000-4000-8000-000000000002', shiftId: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678902' },
  { id: 'seq-00000000-0000-4000-8000-000000000003', shiftId: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678903' },
  { id: 'seq-00000000-0000-4000-8000-000000000004', shiftId: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678904' },
  { id: 'seq-00000000-0000-4000-8000-000000000005', shiftId: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678904' },
];

export function normalizeCalendarConfig(raw: any): CalendarConfig {
  if (!raw) {
    return {
      calendarName: 'Turni di Lavoro',
      shifts: DEFAULT_SHIFTS,
      sequence: DEFAULT_SEQUENCE,
    };
  }

  const legacyMap: Record<string, string> = {
    giorno: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678901',
    notte: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678902',
    smontante: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678903',
    libero: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678904',
    ferie: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678905',
    mattina: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678906',
    pomeriggio: 'a1b2c3d4-e5f6-4a1b-8c9d-012345678907',
  };

  const shiftIdMapping: Record<string, string> = {};

  const shifts: ShiftType[] = Array.isArray(raw.shifts)
    ? raw.shifts.map((s: any) => {
        const targetId = legacyMap[s.id] || (s.id && s.id.length > 20 ? s.id : generateUUID());
        shiftIdMapping[s.id] = targetId;
        return {
          ...s,
          id: targetId,
        };
      })
    : DEFAULT_SHIFTS;

  const sequence: SequenceItem[] = Array.isArray(raw.sequence)
    ? raw.sequence.map((item: any) => {
        if (typeof item === 'string') {
          const shiftId = shiftIdMapping[item] || legacyMap[item] || item;
          return { id: generateUUID(), shiftId };
        } else if (item && typeof item === 'object' && item.shiftId) {
          const shiftId = shiftIdMapping[item.shiftId] || legacyMap[item.shiftId] || item.shiftId;
          return { id: item.id || generateUUID(), shiftId };
        }
        return { id: generateUUID(), shiftId: shifts[0]?.id || '' };
      })
    : DEFAULT_SEQUENCE;

  return {
    calendarName: raw.calendarName || 'Turni di Lavoro',
    calendarId: raw.calendarId,
    shifts,
    sequence,
  };
}


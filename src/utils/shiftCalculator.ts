import type { DayShiftAssignment, ShiftType } from '../types/shift';

export interface MergedCalendarEvent {
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD (exclusive for all-day Google events)
  isAllDay: boolean;
  startTime?: string;
  endTime?: string;
  isOvernight?: boolean;
  color?: string;
}

/**
 * Merges consecutive all-day shifts (e.g. Ferie, Libero) into single multi-day events.
 */
export function processShiftsForCalendar(
  assignments: DayShiftAssignment[],
  shiftTypesMap: Record<string, ShiftType>
): MergedCalendarEvent[] {
  const events: MergedCalendarEvent[] = [];
  let i = 0;

  while (i < assignments.length) {
    const current = assignments[i];
    if (!current.shiftTypeId) {
      i++;
      continue;
    }

    const shiftType = shiftTypesMap[current.shiftTypeId];
    if (!shiftType || shiftType.isNoEvent) {
      i++;
      continue;
    }

    if (shiftType.isAllDay) {
      // Merge consecutive same all-day shifts
      const startDate = current.date;
      let endDate = current.date;
      let j = i + 1;

      while (j < assignments.length) {
        const next = assignments[j];
        if (next.shiftTypeId === current.shiftTypeId) {
          endDate = next.date;
          j++;
        } else {
          break;
        }
      }

      // Calculate Google Calendar exclusive end date (next day)
      const endObj = new Date(endDate);
      endObj.setDate(endObj.getDate() + 1);
      const googleExclusiveEndDate = endObj.toISOString().split('T')[0];

      events.push({
        title: shiftType.name,
        startDate: startDate,
        endDate: googleExclusiveEndDate,
        isAllDay: true,
        color: shiftType.color
      });

      i = j;
    } else {
      // Single timed event
      events.push({
        title: shiftType.name,
        startDate: current.date,
        endDate: current.date,
        isAllDay: false,
        startTime: shiftType.startTime,
        endTime: shiftType.endTime,
        isOvernight: shiftType.isOvernight,
        color: shiftType.color
      });
      i++;
    }
  }

  return events;
}

/**
 * Generates initial month assignment based on cycle sequence and starting shift.
 */
export function generateMonthSequence(
  year: number,
  month: number, // 0-indexed (0 = Jan, 6 = Jul)
  sequence: string[],
  startShiftId: string
): DayShiftAssignment[] {
  const assignments: DayShiftAssignment[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let startIndex = sequence.indexOf(startShiftId);
  if (startIndex === -1) startIndex = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;

    const seqIndex = (startIndex + (day - 1)) % sequence.length;
    assignments.push({
      date: dateStr,
      shiftTypeId: sequence[seqIndex]
    });
  }

  return assignments;
}

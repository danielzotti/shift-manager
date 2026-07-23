import type { MergedCalendarEvent } from '../utils/shiftCalculator';

const SHIFT_MANAGER_CALENDAR_SUMMARY = 'Turni di Lavoro';

/**
 * Finds or creates a primary/dedicated 'Turni di Lavoro' calendar.
 */
export async function getOrCreateShiftCalendar(accessToken: string): Promise<string> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  // 1. List user calendars to check if "Turni di Lavoro" exists
  const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', { headers });
  if (listRes.ok) {
    const data = await listRes.json();
    const existing = data.items?.find((cal: any) => cal.summary === SHIFT_MANAGER_CALENDAR_SUMMARY);
    if (existing) {
      return existing.id;
    }
  }

  // 2. Create calendar if not found
  const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      summary: SHIFT_MANAGER_CALENDAR_SUMMARY,
      description: 'Calendario turni sincronizzato da Shift Manager PWA',
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome',
    }),
  });

  if (createRes.ok) {
    const created = await createRes.json();
    return created.id;
  }

  // Fallback to primary calendar if secondary calendar creation is restricted
  return 'primary';
}

/**
 * Syncs merged events to Google Calendar.
 */
export async function syncEventsToGoogleCalendar(
  accessToken: string,
  events: MergedCalendarEvent[]
): Promise<{ success: boolean; syncedCount: number; calendarId: string }> {
  const calendarId = await getOrCreateShiftCalendar(accessToken);
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome';
  let count = 0;

  for (const event of events) {
    let body: any = {
      summary: event.title,
      description: 'Sincronizzato da Shift Manager',
    };

    if (event.isAllDay) {
      body.start = { date: event.startDate };
      body.end = { date: event.endDate }; // Google Calendar all-day exclusive end date
    } else {
      // Calculate start and end ISO strings
      let startDateTimeStr = `${event.startDate}T${event.startTime || '00:00'}:00`;
      let endDateTimeStr = `${event.endDate}T${event.endTime || '23:59'}:00`;

      if (event.isOvernight) {
        // Increment end date by +1 day for overnight shift
        const endDateObj = new Date(`${event.startDate}T00:00:00`);
        endDateObj.setDate(endDateObj.getDate() + 1);
        const nextDayStr = endDateObj.toISOString().split('T')[0];
        endDateTimeStr = `${nextDayStr}T${event.endTime || '07:30'}:00`;
      }

      body.start = { dateTime: new Date(startDateTimeStr).toISOString(), timeZone };
      body.end = { dateTime: new Date(endDateTimeStr).toISOString(), timeZone };
    }

    const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (res.ok) {
      count++;
    } else {
      const errJson = await res.json();
      console.error('Failed to create event in Google Calendar:', errJson);
    }
  }

  return { success: true, syncedCount: count, calendarId };
}

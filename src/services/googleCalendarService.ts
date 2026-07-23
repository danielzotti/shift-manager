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
      const isOvernightShift = event.isOvernight || (event.startTime && event.endTime && event.startTime > event.endTime);

      let startDateStr = event.startDate;
      let endDateStr = event.endDate;

      if (isOvernightShift) {
        // Increment end date by +1 day for overnight shift safely without UTC shifts
        const [year, month, day] = event.startDate.split('-').map(Number);
        const endDateObj = new Date(year, month - 1, day + 1);
        const nextYear = endDateObj.getFullYear();
        const nextMonth = String(endDateObj.getMonth() + 1).padStart(2, '0');
        const nextDay = String(endDateObj.getDate()).padStart(2, '0');
        endDateStr = `${nextYear}-${nextMonth}-${nextDay}`;
      }

      let startDateTimeStr = `${startDateStr}T${event.startTime || '00:00'}:00`;
      let endDateTimeStr = `${endDateStr}T${event.endTime || '23:59'}:00`;

      body.start = { dateTime: startDateTimeStr, timeZone };
      body.end = { dateTime: endDateTimeStr, timeZone };
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

/**
 * Deletes events from Google Calendar based on filter options.
 */
export async function deleteGoogleCalendarEvents(
  accessToken: string,
  options: {
    deleteOption: 'all' | 'from' | 'until' | 'range';
    fromDate?: string;
    toDate?: string;
  }
): Promise<{ success: boolean; deletedCount: number }> {
  const calendarId = await getOrCreateShiftCalendar(accessToken);
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  let pageToken: string | undefined = undefined;
  let deletedCount = 0;

  do {
    let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?maxResults=2500&singleEvents=true`;

    if (options.deleteOption === 'from' || options.deleteOption === 'range') {
      if (options.fromDate) {
        url += `&timeMin=${encodeURIComponent(new Date(`${options.fromDate}T00:00:00`).toISOString())}`;
      }
    }
    if (options.deleteOption === 'until' || options.deleteOption === 'range') {
      if (options.toDate) {
        url += `&timeMax=${encodeURIComponent(new Date(`${options.toDate}T23:59:59.999`).toISOString())}`;
      }
    }
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }

    const listRes = await fetch(url, { headers });
    if (!listRes.ok) {
      const errJson = await listRes.json();
      console.error('Failed to list events for deletion:', errJson);
      throw new Error(errJson.error?.message || 'Failed to list Google Calendar events');
    }

    const data = await listRes.json();
    const items = data.items || [];

    for (const item of items) {
      if (item.id) {
        const delRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(item.id)}`,
          { method: 'DELETE', headers }
        );
        if (delRes.ok || delRes.status === 410 || delRes.status === 404) {
          deletedCount++;
        } else {
          console.error(`Failed to delete event ${item.id}:`, await delRes.text());
        }
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return { success: true, deletedCount };
}


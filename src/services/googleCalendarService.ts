import type { MergedCalendarEvent } from '../utils/shiftCalculator';

export const APP_ID_TAG = '[APP_ID: shift-manager]';
export const DEFAULT_CALENDAR_SUMMARY = 'Shift Manager';

export async function fetchShiftCalendarSummary(accessToken: string): Promise<string | null> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', { headers });
  if (listRes.ok) {
    const data = await listRes.json();
    const existing = data.items?.find((cal: any) => cal.description && cal.description.includes(APP_ID_TAG));
    if (existing && existing.summary) {
      return existing.summary;
    }
  }
  return null;
}

export async function updateShiftCalendarName(accessToken: string, newSummary: string): Promise<string> {
  return await getOrCreateShiftCalendar(accessToken, newSummary);
}

/**
 * Finds or creates a dedicated 'Shift Manager' calendar identified by [APP_ID: shift-manager] in description.
 * Never uses the primary calendar!
 */
export async function getOrCreateShiftCalendar(accessToken: string, desiredSummary: string = DEFAULT_CALENDAR_SUMMARY): Promise<string> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  // 1. List user calendars to check if calendar with APP_ID in description exists
  const listRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', { headers });
  if (listRes.ok) {
    const data = await listRes.json();
    const existing = data.items?.find((cal: any) => cal.description && cal.description.includes(APP_ID_TAG));
    if (existing) {
      // Check if calendar name needs updating
      if (desiredSummary && existing.summary !== desiredSummary) {
        const patchRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(existing.id)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ summary: desiredSummary }),
        });
        if (!patchRes.ok) {
          const errData = await patchRes.json().catch(() => ({}));
          console.error('Failed to update calendar summary:', errData);
          throw new Error(errData?.error?.message || 'Permessi insufficienti per modificare il calendario.');
        }
      }
      return existing.id;
    }
  }

  // 2. Create calendar if not found
  const createRes = await fetch('https://www.googleapis.com/calendar/v3/calendars', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      summary: desiredSummary || DEFAULT_CALENDAR_SUMMARY,
      description: APP_ID_TAG,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome',
    }),
  });

  if (createRes.ok) {
    const created = await createRes.json();
    return created.id;
  }

  const errData = await createRes.json().catch(() => ({}));
  throw new Error(errData?.error?.message || 'Impossibile creare il calendario dedicato per Shift Manager su Google Calendar.');
}

/**
 * Deletes all events created by Shift Manager for a specific month (YYYY-MM).
 */
export async function deleteMonthShiftEvents(
  accessToken: string,
  calendarId: string,
  yearMonth: string // e.g. "2026-07"
): Promise<void> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  // Calculate start of month and end of month ISO bounds
  const [yearStr, monthStr] = yearMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const timeMin = new Date(year, month - 1, 1, 0, 0, 0).toISOString();
  const lastDay = new Date(year, month, 0).getDate();
  const timeMax = new Date(year, month - 1, lastDay, 23, 59, 59, 999).toISOString();

  let pageToken: string | undefined = undefined;

  do {
    let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) break;

    const data = await res.json();
    const items = data.items || [];

    for (const item of items) {
      const isShiftManagerEvent =
        item.extendedProperties?.private?.appId === 'shift-manager' ||
        (item.description && item.description.includes(APP_ID_TAG));

      if (isShiftManagerEvent && item.id) {
        await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(item.id)}`,
          { method: 'DELETE', headers }
        );
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);
}

/**
 * Syncs merged events to Google Calendar for a specific month.
 * First deletes existing Shift Manager events for that month, then creates new ones.
 */
export async function syncEventsToGoogleCalendar(
  accessToken: string,
  events: MergedCalendarEvent[],
  yearMonth?: string,
  desiredSummary?: string
): Promise<{ success: boolean; syncedCount: number; calendarId: string }> {
  const calendarId = await getOrCreateShiftCalendar(accessToken, desiredSummary);
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  // If a specific month is targeted, delete all Shift Manager events in that month first
  if (yearMonth) {
    await deleteMonthShiftEvents(accessToken, calendarId, yearMonth);
  } else if (events.length > 0) {
    // Derive yearMonth from the first event if not explicitly supplied
    const sampleDate = events[0].startDate; // YYYY-MM-DD
    const ym = sampleDate.substring(0, 7);
    await deleteMonthShiftEvents(accessToken, calendarId, ym);
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome';
  let count = 0;

  for (const event of events) {
    let body: any = {
      summary: event.title,
      description: APP_ID_TAG,
      extendedProperties: {
        private: {
          appId: 'shift-manager',
        },
      },
    };

    if (event.isAllDay) {
      body.start = { date: event.startDate };
      body.end = { date: event.endDate }; // Google Calendar all-day exclusive end date
    } else {
      const isOvernightShift = event.isOvernight || (event.startTime && event.endTime && event.startTime > event.endTime);

      let startDateStr = event.startDate;
      let endDateStr = event.endDate;

      if (isOvernightShift) {
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
 * Deletes events from Google Calendar based on filter options (only events created by Shift Manager).
 */
export async function deleteGoogleCalendarEvents(
  accessToken: string,
  options: {
    deleteOption: 'all' | 'from' | 'until' | 'range';
    fromDate?: string;
    toDate?: string;
  },
  desiredSummary?: string
): Promise<{ success: boolean; deletedCount: number }> {
  const calendarId = await getOrCreateShiftCalendar(accessToken, desiredSummary);
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
      const isShiftManagerEvent =
        item.extendedProperties?.private?.appId === 'shift-manager' ||
        (item.description && item.description.includes(APP_ID_TAG));

      if (isShiftManagerEvent && item.id) {
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



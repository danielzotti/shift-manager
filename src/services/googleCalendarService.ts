import type { MergedCalendarEvent } from '../utils/shiftCalculator';
import type { CalendarConfig } from '../types/shift';
import { normalizeCalendarConfig } from '../types/shift';

export const APP_ID_TAG = '[APP_ID: shift-manager]';
export const DEFAULT_CALENDAR_SUMMARY = 'Shift Manager';

async function handleResponseError(res: Response, defaultMessage: string): Promise<never> {
  const errJson = await res.json().catch(() => ({}));
  if (
    res.status === 401 ||
    errJson?.error?.code === 401 ||
    errJson?.error?.status === 'UNAUTHENTICATED' ||
    errJson?.error?.message?.includes('UNAUTHENTICATED') ||
    errJson?.error?.errors?.some((e: any) => e.reason === 'authError' || e.message === 'Invalid Credentials')
  ) {
    const authErr = new Error('Sessione Google non autenticata o scaduta. Effettua nuovamente il login.');
    (authErr as any).status = 401;
    (authErr as any).isUnauthenticated = true;
    throw authErr;
  }
  throw new Error(errJson?.error?.message || defaultMessage);
}

export const CONFIG_EVENT_SUMMARY = '[SHIFT_MANAGER_CONFIG]';
export const CONFIG_EVENT_DATE = '2000-01-01';

export async function fetchShiftCalendarConfig(accessToken: string): Promise<CalendarConfig | null> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const calendarId = await getOrCreateShiftCalendar(accessToken);
  if (!calendarId) return null;

  const timeMin = new Date('2000-01-01T00:00:00Z').toISOString();
  const timeMax = new Date('2000-01-02T23:59:59Z').toISOString();

  const searchRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&q=${encodeURIComponent(CONFIG_EVENT_SUMMARY)}`,
    { headers }
  );

  if (searchRes.ok) {
    const data = await searchRes.json();
    const configEvent = data.items?.find((item: any) => item.summary === CONFIG_EVENT_SUMMARY);
    if (configEvent && configEvent.description) {
      try {
        const parsed = JSON.parse(configEvent.description);
        return normalizeCalendarConfig(parsed);
      } catch (e) {
        console.error('Failed to parse config JSON from metadata event:', e);
      }
    }
  } else {
    await handleResponseError(searchRes, 'Impossibile recuperare la configurazione dei turni da Google Calendar.');
  }

  return null;
}

export async function saveShiftCalendarConfig(accessToken: string, config: CalendarConfig): Promise<void> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  const calendarId = await getOrCreateShiftCalendar(accessToken, config.calendarName);
  const timeMin = new Date('2000-01-01T00:00:00Z').toISOString();
  const timeMax = new Date('2000-01-02T23:59:59Z').toISOString();

  // 1. Search for existing config event
  const searchRes = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&q=${encodeURIComponent(CONFIG_EVENT_SUMMARY)}`,
    { headers }
  );

  if (!searchRes.ok) {
    await handleResponseError(searchRes, 'Impossibile cercare la configurazione su Google Calendar.');
  }

  const searchData = await searchRes.json();
  const existingEvent = searchData.items?.find((item: any) => item.summary === CONFIG_EVENT_SUMMARY);

  const eventBody = {
    summary: CONFIG_EVENT_SUMMARY,
    description: JSON.stringify(config),
    start: { date: CONFIG_EVENT_DATE },
    end: { date: '2000-01-02' },
    extendedProperties: {
      private: {
        appId: 'shift-manager',
        type: 'config',
      },
    },
    transparency: 'transparent', // Doesn't block time on calendar
    visibility: 'private',
  };

  if (existingEvent?.id) {
    // 2. Update existing metadata event
    const patchRes = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(existingEvent.id)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify(eventBody),
      }
    );
    if (!patchRes.ok) {
      await handleResponseError(patchRes, 'Impossibile aggiornare la configurazione dei turni su Google Calendar.');
    }
  } else {
    // 3. Create new metadata event
    const createRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(eventBody),
    });
    if (!createRes.ok) {
      await handleResponseError(createRes, 'Impossibile salvare la configurazione dei turni su Google Calendar.');
    }
  }
}

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
    return null;
  } else {
    await handleResponseError(listRes, 'Impossibile accedere alla lista dei calendari Google.');
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
      if (desiredSummary && existing.summary !== desiredSummary) {
        const patchRes = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(existing.id)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ summary: desiredSummary }),
        });
        if (!patchRes.ok) {
          await handleResponseError(patchRes, 'Permessi insufficienti per modificare il calendario.');
        }
      }
      return existing.id;
    }
  } else {
    await handleResponseError(listRes, 'Impossibile accedere ai calendari Google.');
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

  return await handleResponseError(createRes, 'Impossibile creare il calendario dedicato per Shift Manager su Google Calendar.');
}

export type SyncProgressHandler = (status: {
  date: string;
  type: 'deleting' | 'deleted' | 'creating' | 'created';
  deletedCount?: number;
  createdCount?: number;
}) => void;

/**
 * Deletes all events created by Shift Manager for a specific month (YYYY-MM).
 */
export async function deleteMonthShiftEvents(
  accessToken: string,
  calendarId: string,
  yearMonth: string, // e.g. "2026-07"
  onProgress?: SyncProgressHandler
): Promise<number> {
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
  let deletedCount = 0;

  do {
    let url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true`;
    if (pageToken) {
      url += `&pageToken=${encodeURIComponent(pageToken)}`;
    }

    const res = await fetch(url, { headers });
    if (!res.ok) {
      await handleResponseError(res, `Impossibile recuperare gli eventi da Google Calendar (HTTP ${res.status})`);
    }

    const data = await res.json();
    const items = data.items || [];

    for (const item of items) {
      const isShiftManagerEvent =
        item.extendedProperties?.private?.appId === 'shift-manager' ||
        (item.description && item.description.includes(APP_ID_TAG));

      if (isShiftManagerEvent && item.id) {
        const dateStr = item.start?.date || (item.start?.dateTime ? item.start.dateTime.substring(0, 10) : null);
        if (dateStr && onProgress) {
          onProgress({ date: dateStr, type: 'deleting', deletedCount });
        }

        const delRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(item.id)}`,
          { method: 'DELETE', headers }
        );
        if (!delRes.ok && delRes.status !== 404 && delRes.status !== 410) {
          await handleResponseError(delRes, `Impossibile eliminare l'evento da Google Calendar (HTTP ${delRes.status})`);
        }
        deletedCount++;
        if (dateStr && onProgress) {
          onProgress({ date: dateStr, type: 'deleted', deletedCount });
        }
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return deletedCount;
}

/**
 * Syncs merged events to Google Calendar for a specific month.
 * First deletes existing Shift Manager events for that month, then creates new ones.
 */
export async function syncEventsToGoogleCalendar(
  accessToken: string,
  events: MergedCalendarEvent[],
  yearMonth?: string,
  desiredSummary?: string,
  onProgress?: SyncProgressHandler
): Promise<{ success: boolean; syncedCount: number; deletedCount: number; calendarId: string }> {
  const calendarId = await getOrCreateShiftCalendar(accessToken, desiredSummary);
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  let deletedCount = 0;

  // If a specific month is targeted, delete all Shift Manager events in that month first
  if (yearMonth) {
    deletedCount = await deleteMonthShiftEvents(accessToken, calendarId, yearMonth, onProgress);
  } else if (events.length > 0) {
    // Derive yearMonth from the first event if not explicitly supplied
    const sampleDate = events[0].startDate; // YYYY-MM-DD
    const ym = sampleDate.substring(0, 7);
    deletedCount = await deleteMonthShiftEvents(accessToken, calendarId, ym, onProgress);
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome';
  let createdCount = 0;

  for (const event of events) {
    if (onProgress) {
      onProgress({ date: event.startDate, type: 'creating', deletedCount, createdCount });
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

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
      createdCount++;
      if (onProgress) {
        onProgress({ date: event.startDate, type: 'created', deletedCount, createdCount });
        await new Promise((resolve) => setTimeout(resolve, 80));
      }
    } else {
      await handleResponseError(res, `Errore durante la creazione dell'evento "${event.title}" su Google Calendar (HTTP ${res.status})`);
    }
  }

  return { success: true, syncedCount: createdCount, deletedCount, calendarId };
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
      await handleResponseError(listRes, 'Failed to list Google Calendar events');
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
          await handleResponseError(delRes, `Impossibile eliminare l'evento "${item.summary || item.id}" da Google Calendar.`);
        }
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  return { success: true, deletedCount };
}



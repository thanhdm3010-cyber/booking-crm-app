import { google } from "googleapis";

function getClient() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env;
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) return null;
  const client = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET);
  client.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN });
  return client;
}

export async function getGoogleBusy(start:string,end:string) {
  const auth = getClient();
  if (!auth) return [];
  const calendar = google.calendar({ version: "v3", auth });
  const response = await calendar.freebusy.query({
    requestBody:{
      timeMin:start,
      timeMax:end,
      items:[{id:process.env.GOOGLE_CALENDAR_ID || "primary"}]
    }
  });
  return response.data.calendars?.[process.env.GOOGLE_CALENDAR_ID || "primary"]?.busy || [];
}

export async function createCalendarEvent(input: {
  summary: string; description: string; start: string; end: string; attendeeEmail: string;
}) {
  const auth = getClient();
  if (!auth) return { eventId: null, meetUrl: null, skipped: true };
  const calendar = google.calendar({ version: "v3", auth });
  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
    conferenceDataVersion: 1,
    sendUpdates: "all",
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.start },
      end: { dateTime: input.end },
      attendees: [{ email: input.attendeeEmail }],
      conferenceData: {
        createRequest: { requestId: crypto.randomUUID(), conferenceSolutionKey: { type: "hangoutsMeet" } }
      }
    }
  });
  const event = response.data;
  const meetUrl = event.hangoutLink || event.conferenceData?.entryPoints?.find((x) => x.entryPointType === "video")?.uri || null;
  return { eventId: event.id || null, meetUrl, skipped: false };
}

export async function updateCalendarEvent(eventId: string | null | undefined, input: { start: string; end: string }) {
  const auth = getClient();
  if (!auth || !eventId) return { skipped: true };
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.patch({
    calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
    eventId,
    sendUpdates: "all",
    requestBody: { start: { dateTime: input.start }, end: { dateTime: input.end } }
  });
  return { skipped: false };
}

export async function deleteCalendarEvent(eventId?: string | null) {
  const auth = getClient();
  if (!auth || !eventId) return { skipped: true };
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({ calendarId: process.env.GOOGLE_CALENDAR_ID || "primary", eventId, sendUpdates: "all" });
  return { skipped: false };
}

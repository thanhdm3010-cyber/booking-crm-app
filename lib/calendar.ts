import { google } from "googleapis";
import { config } from "./config";

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
  try {
    const request = calendar.freebusy.query({
      requestBody:{
        timeMin:start,
        timeMax:end,
        items:[{id:process.env.GOOGLE_CALENDAR_ID || "primary"}]
      }
    });
    const timeout = new Promise<never>((_,reject)=>setTimeout(()=>reject(new Error("Google Calendar timeout")),3500));
    const response = await Promise.race([request,timeout]);
    return response.data.calendars?.[process.env.GOOGLE_CALENDAR_ID || "primary"]?.busy || [];
  } catch (error) {
    console.error("getGoogleBusy failed", error);
    return [];
  }
}

export async function createCalendarEvent(input: {
  summary: string; description: string; start: string; end: string; attendeeEmail: string;
}) {
  const auth = getClient();
  const zoomInfo = [
    input.description,
    "",
    "Tham dự qua Zoom:",
    config.zoomUrl,
    "Meeting ID: " + config.zoomMeetingId,
    "Passcode: " + config.zoomPasscode
  ].filter(Boolean).join("\n");

  if (!auth) return { eventId: null, meetUrl: config.zoomUrl, skipped: true };
  const calendar = google.calendar({ version: "v3", auth });
  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_ID || "primary",
    sendUpdates: "all",
    requestBody: {
      summary: input.summary,
      description: zoomInfo,
      location: config.zoomUrl,
      start: { dateTime: input.start },
      end: { dateTime: input.end },
      attendees: [{ email: input.attendeeEmail }]
    }
  });
  const event = response.data;
  return { eventId: event.id || null, meetUrl: config.zoomUrl, skipped: false };
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

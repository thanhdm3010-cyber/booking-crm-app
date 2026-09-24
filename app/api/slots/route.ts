import { NextRequest } from "next/server";
import { config } from "@/lib/config";
import { getBookings } from "@/lib/store";

function isoWithOffset(date: string, hour: number, minute: number) {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return `${date}T${hh}:${mm}:00+07:00`;
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  const slug = request.nextUrl.searchParams.get("slug");

  if (!date || slug !== config.hostSlug) {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const target = new Date(`${date}T12:00:00+07:00`);
  const weekday = target.getDay();
  if (weekday === 0 || weekday === 6) return Response.json({ slots: [] });

  const bookings = await getBookings();
  const slots = [];
  const step = config.durationMinutes + config.bufferMinutes;

  for (let mins = config.workingHours.start * 60; mins + config.durationMinutes <= config.workingHours.end * 60; mins += step) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const start = isoWithOffset(date, h, m);
    const endMins = mins + config.durationMinutes;
    const end = isoWithOffset(date, Math.floor(endMins / 60), endMins % 60);

    const startMs = new Date(start).getTime();
    const endMs = new Date(end).getTime();
    const conflict = bookings.some((b) =>
      b.status === "confirmed" &&
      startMs < new Date(b.end).getTime() &&
      endMs > new Date(b.start).getTime()
    );

    if (!conflict && startMs > Date.now()) {
      slots.push({
        start,
        end,
        label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      });
    }
  }

  return Response.json({ slots });
}

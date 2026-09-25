import { getBookings, updateBooking } from "@/lib/store";
import { sendReminder } from "@/lib/email";

export async function POST(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) return Response.json({ error: "Unauthorized" }, { status: 401 });
  const all = await getBookings();
  const now = Date.now();
  let sent = 0;
  for (const b of all) {
    if (b.status !== "confirmed") continue;
    const diffH = (new Date(b.start).getTime() - now) / 3600000;
    if (diffH > 23 && diffH <= 25 && !b.reminder24hSentAt) {
      await sendReminder({ customerEmail: b.customerEmail, customerName: b.customerName, hostName: b.hostName, start: b.start, meetUrl: b.meetUrl, kind: "24h" });
      await updateBooking(b.id, { reminder24hSentAt: new Date().toISOString() }); sent++;
    }
    if (diffH >= 0.75 && diffH <= 1.25 && !b.reminder1hSentAt) {
      await sendReminder({ customerEmail: b.customerEmail, customerName: b.customerName, hostName: b.hostName, start: b.start, meetUrl: b.meetUrl, kind: "1h" });
      await updateBooking(b.id, { reminder1hSentAt: new Date().toISOString() }); sent++;
    }
  }
  return Response.json({ ok: true, sent });
}

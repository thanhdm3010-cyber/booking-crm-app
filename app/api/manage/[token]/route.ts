import { z } from "zod";
import { cancelBookingByToken, getBookingByToken, rescheduleBookingByToken } from "@/lib/store";
import { deleteCalendarEvent, updateCalendarEvent } from "@/lib/calendar";
import { sendCancellation } from "@/lib/email";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByToken(token);
  if (!booking) return Response.json({ error: "Không tìm thấy lịch hẹn." }, { status: 404 });
  return Response.json({ booking });
}

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("cancel") }),
  z.object({ action: z.literal("reschedule"), start: z.string().datetime({ offset: true }), end: z.string().datetime({ offset: true }) })
]);

export async function PATCH(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const booking = await getBookingByToken(token);
  if (!booking) return Response.json({ error: "Không tìm thấy lịch hẹn." }, { status: 404 });
  const body = schema.parse(await request.json());

  if (body.action === "cancel") {
    await deleteCalendarEvent(booking.calendarEventId);
    const updated = await cancelBookingByToken(token);
    await sendCancellation({ customerEmail: booking.customerEmail, customerName: booking.customerName, hostName: booking.hostName, start: booking.start });
    return Response.json({ ok: true, booking: updated });
  }

  await updateCalendarEvent(booking.calendarEventId, { start: body.start, end: body.end });
  try {
    const updated = await rescheduleBookingByToken(token,body.start,body.end);
    return Response.json({ ok: true, booking: updated });
  } catch {
    return Response.json({ error: "Khung giờ mới đã có người đặt hoặc không hợp lệ." }, { status: 409 });
  }
}

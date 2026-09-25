import { Resend } from "resend";
import { config } from "./config";
import { bookingWorkbookFilename, createBookingWorkbook } from "./excel";

function mailer() {
  const apiKey = process.env.RESEND_API_KEY;
  return apiKey ? new Resend(apiKey) : null;
}
const from = () => process.env.EMAIL_FROM || "Booking App <onboarding@resend.dev>";
const fmt = (iso: string) => new Date(iso).toLocaleString("vi-VN", { timeZone: config.timezone, dateStyle: "full", timeStyle: "short" });

function zoomBlock(url?: string | null) {
  const link = url || config.zoomUrl;
  return `<p><strong>Tham dự qua Zoom:</strong> <a href="${link}">${link}</a></p>
  <p><strong>Meeting ID:</strong> ${config.zoomMeetingId}<br/>
  <strong>Passcode:</strong> ${config.zoomPasscode}</p>`;
}

export async function sendBookingEmails(input: {
  manageToken: string; hostName: string; hostEmail: string; customerName: string; customerEmail: string;
  start: string; end: string; meetUrl?: string | null; note?: string;
  customerPhone?: string; surveyData?: Record<string,unknown>; source?: string; campaign?: string;
}) {
  const resend = mailer();
  if (!resend) return { skipped: true };
  const manageUrl = `${config.appUrl}/manage/${input.manageToken}`;
  const zoom = zoomBlock(input.meetUrl);
  const hostRecipient = input.hostEmail || "thanhdm3010@gmail.com";

  const customerResult = await resend.emails.send({
    from: from(),
    to: input.customerEmail,
    subject: `Xác nhận lịch hẹn với ${input.hostName}`,
    html: `
      <h2>Đặt lịch thành công</h2><p>Xin chào ${input.customerName},</p>
      <p>Lịch hẹn của bạn với <strong>${input.hostName}</strong> đã được xác nhận.</p>
      <p><strong>Thời gian:</strong> ${fmt(input.start)}</p>${zoom}
      <p><a href="${manageUrl}">Đổi hoặc hủy lịch</a></p>`
  });

  if (customerResult.error) {
    console.error("Customer booking email failed", customerResult.error);
  } else {
    console.log("Customer booking email sent", { to: input.customerEmail, id: customerResult.data?.id });
  }

  const workbook = await createBookingWorkbook({
    customerName: input.customerName,
    customerEmail: input.customerEmail,
    customerPhone: input.customerPhone,
    start: input.start,
    end: input.end,
    status: "confirmed",
    source: input.source,
    campaign: input.campaign,
    meetUrl: input.meetUrl,
    note: input.note,
    surveyData: input.surveyData
  });

  const hostResult = await resend.emails.send({
    from: from(),
    to: hostRecipient,
    subject: `Lịch hẹn mới: ${input.customerName}`,
    html: `
      <h2>Bạn có một lịch hẹn mới</h2>
      <p><strong>Khách:</strong> ${input.customerName}</p>
      <p><strong>Email:</strong> ${input.customerEmail}</p>
      <p><strong>Điện thoại:</strong> ${input.customerPhone || "Không có"}</p>
      <p><strong>Thời gian:</strong> ${fmt(input.start)}</p>
      <p><strong>Nội dung:</strong> ${input.note || "Không có"}</p>
      <p>File Excel đính kèm chứa toàn bộ thông tin booking và câu trả lời khảo sát của khách.</p>${zoom}`,
    attachments: [{
      filename: bookingWorkbookFilename(input.customerName,input.start),
      content: workbook
    }]
  });

  if (hostResult.error) {
    console.error("Host booking email failed", hostResult.error);
  } else {
    console.log("Host booking email sent", { to: hostRecipient, id: hostResult.data?.id });
  }

  return {
    skipped: false,
    customer: customerResult.data?.id || null,
    host: hostResult.data?.id || null,
    hostRecipient
  };
}

export async function sendReminder(input: { customerEmail: string; customerName: string; hostName: string; start: string; meetUrl?: string | null; kind: "24h" | "1h" }) {
  const resend = mailer();
  if (!resend) return { skipped: true };
  await resend.emails.send({
    from: from(), to: input.customerEmail,
    subject: `Nhắc lịch hẹn ${input.kind === "24h" ? "ngày mai" : "sắp bắt đầu"}`,
    html: `<p>Xin chào ${input.customerName},</p><p>Đây là lời nhắc lịch hẹn với <strong>${input.hostName}</strong>.</p><p><strong>Thời gian:</strong> ${fmt(input.start)}</p>${zoomBlock(input.meetUrl)}`
  });
  return { skipped: false };
}

export async function sendCancellation(input: { customerEmail: string; customerName: string; hostName: string; start: string }) {
  const resend = mailer();
  if (!resend) return { skipped: true };
  await resend.emails.send({ from: from(), to: input.customerEmail, subject: "Lịch hẹn đã được hủy", html: `<p>Xin chào ${input.customerName},</p><p>Lịch hẹn với ${input.hostName} vào ${fmt(input.start)} đã được hủy.</p>` });
  return { skipped: false };
}

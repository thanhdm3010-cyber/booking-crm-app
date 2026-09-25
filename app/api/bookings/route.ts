import { z } from "zod";
import { config } from "@/lib/config";
import { hasConflict, saveBooking } from "@/lib/store";
import { createCalendarEvent } from "@/lib/calendar";
import { sendBookingEmails } from "@/lib/email";
import { Booking } from "@/lib/types";

const schema = z.object({
  hostSlug:z.string(), customerName:z.string().min(2), customerEmail:z.string().email(),
  customerPhone:z.string().optional(), note:z.string().optional(),
  surveyData:z.record(z.string(),z.unknown()).default({}),
  source:z.string().optional(), campaign:z.string().optional(),
  start:z.string().datetime({offset:true}), end:z.string().datetime({offset:true})
});

export async function POST(request:Request){
  try{
    const body=schema.parse(await request.json());
    if(body.hostSlug!==config.hostSlug) return Response.json({error:"Host không tồn tại."},{status:404});
    if(await hasConflict(body.start,body.end)) return Response.json({error:"Khung giờ này vừa được người khác đặt. Vui lòng chọn giờ khác."},{status:409});

    const manageToken=crypto.randomUUID();
    const calendar=await createCalendarEvent({
      summary:`Tư vấn với ${body.customerName}`,
      description:body.note || "Booking từ webapp",
      start:body.start,end:body.end,attendeeEmail:body.customerEmail
    });
    const now=new Date().toISOString();
    const booking:Booking={
      id:crypto.randomUUID(),manageToken,hostSlug:config.hostSlug,hostName:config.hostName,hostEmail:config.hostEmail,
      customerName:body.customerName,customerEmail:body.customerEmail,customerPhone:body.customerPhone,note:body.note,
      surveyData:body.surveyData,source:body.source,campaign:body.campaign,start:body.start,end:body.end,timezone:config.timezone,
      status:"confirmed",crmStage:"booked",meetUrl:calendar.meetUrl,calendarEventId:calendar.eventId,createdAt:now,updatedAt:now
    };
    await saveBooking(booking);
    await sendBookingEmails({
      manageToken,hostName:config.hostName,hostEmail:config.hostEmail,customerName:body.customerName,
      customerEmail:body.customerEmail,start:body.start,end:body.end,meetUrl:calendar.meetUrl,note:body.note
    });
    return Response.json({ok:true,bookingId:booking.id,manageToken,meetUrl:booking.meetUrl});
  }catch(error){
    console.error(error);
    return Response.json({error:"Dữ liệu chưa hợp lệ hoặc hệ thống gặp lỗi."},{status:400});
  }
}

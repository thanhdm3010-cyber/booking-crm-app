import { createClient } from '@/lib/supabase/server';
import type { Booking } from './types';

function fromRow(b:any): Booking {
  return {
    id:b.id,
    manageToken:b.manage_token,
    hostSlug:process.env.HOST_SLUG || 'manhthanh',
    hostName:process.env.HOST_NAME || 'Đỗ Mạnh Thành',
    hostEmail:process.env.HOST_EMAIL || '',
    customerName:b.customer_name,
    customerEmail:b.customer_email,
    customerPhone:b.customer_phone || undefined,
    note:b.note || undefined,
    source:b.source || undefined,
    campaign:b.campaign || undefined,
    start:b.start_at,
    end:b.end_at,
    timezone:b.timezone,
    status:b.status,
    crmStage:b.crm_status,
    meetUrl:b.meeting_url,
    calendarEventId:b.calendar_event_id,
    reminder24hSentAt:b.reminder_24h_sent_at,
    reminder1hSentAt:b.reminder_1h_sent_at,
    createdAt:b.created_at,
    updatedAt:b.updated_at,
  } as Booking;
}

export async function getBookings(): Promise<Booking[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('bookings').select('*').order('created_at',{ascending:false});
  if (error) throw error;
  return (data || []).map(fromRow);
}

export async function getPublicBookedSlots(start:string,end:string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('bookings')
    .select('start_at,end_at,status')
    .eq('status','confirmed')
    .lt('start_at',end)
    .gt('end_at',start);
  if (error) throw error;
  return data || [];
}

export async function getAvailability(hostSlug:string, weekday:number) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('availability')
    .select('start_time,end_time,timezone')
    .eq('host_slug',hostSlug)
    .eq('weekday',weekday)
    .eq('is_active',true)
    .order('start_time');
  if (error) throw error;
  return data || [];
}

export async function getBusyBlocks(hostSlug:string,start:string,end:string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('busy_blocks')
    .select('start_at,end_at')
    .eq('host_slug',hostSlug)
    .lt('start_at',end)
    .gt('end_at',start);
  if (error) throw error;
  return data || [];
}

export async function saveBooking(booking: Booking) {
  const supabase = await createClient();
  const { error } = await supabase.from('bookings').insert({
    id:booking.id,
    customer_name:booking.customerName,
    customer_email:booking.customerEmail,
    customer_phone:booking.customerPhone || null,
    note:booking.note || null,
    start_at:booking.start,
    end_at:booking.end,
    timezone:booking.timezone,
    status:booking.status,
    crm_status:booking.crmStage,
    source:booking.source || null,
    campaign:booking.campaign || null,
    meeting_url:booking.meetUrl || null,
    calendar_event_id:booking.calendarEventId || null,
    manage_token:booking.manageToken,
  });
  if (error) throw error;
}

export async function getBookingByToken(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc('get_booking_by_manage_token',{p_token:token});
  if (error) throw error;
  const row = data?.[0];
  return row ? fromRow(row) : null;
}

export async function cancelBookingByToken(token:string) {
  const supabase = await createClient();
  const { data,error } = await supabase.rpc('cancel_booking_by_manage_token',{p_token:token});
  if(error) throw error;
  return data?.[0] ? fromRow(data[0]) : null;
}

export async function rescheduleBookingByToken(token:string,start:string,end:string) {
  const supabase = await createClient();
  const { data,error } = await supabase.rpc('reschedule_booking_by_manage_token',{p_token:token,p_start:start,p_end:end});
  if(error) throw error;
  return data?.[0] ? fromRow(data[0]) : null;
}

export async function updateBooking(id: string, patch: Partial<Booking>) {
  const supabase = await createClient();
  const row:any = {};
  if (patch.status !== undefined) row.status = patch.status;
  if (patch.crmStage !== undefined) row.crm_status = patch.crmStage;
  if (patch.start !== undefined) row.start_at = patch.start;
  if (patch.end !== undefined) row.end_at = patch.end;
  if (patch.meetUrl !== undefined) row.meeting_url = patch.meetUrl;
  if (patch.calendarEventId !== undefined) row.calendar_event_id = patch.calendarEventId;
  if (patch.reminder24hSentAt !== undefined) row.reminder_24h_sent_at = patch.reminder24hSentAt;
  if (patch.reminder1hSentAt !== undefined) row.reminder_1h_sent_at = patch.reminder1hSentAt;
  row.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from('bookings').update(row).eq('id',id).select('*').maybeSingle();
  if (error) throw error;
  return data ? fromRow(data) : null;
}

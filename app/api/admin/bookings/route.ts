import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getBookings, updateBooking } from '@/lib/store';

async function authorized(){
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return !!data.user;
}
export async function GET(){
  if(!(await authorized())) return Response.json({error:'Unauthorized'},{status:401});
  return Response.json({bookings:await getBookings()});
}
export async function PATCH(request:Request){
  if(!(await authorized())) return Response.json({error:'Unauthorized'},{status:401});
  const body=z.object({id:z.string().uuid(),crmStage:z.enum(['booked','attended','follow_up','interested','customer','lost'])}).parse(await request.json());
  const updated=await updateBooking(body.id,{crmStage:body.crmStage as any});
  return Response.json({ok:true,booking:updated});
}

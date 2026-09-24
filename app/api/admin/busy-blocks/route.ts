import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

async function admin(){
  const supabase=await createClient();
  const {data}=await supabase.auth.getUser();
  if(!data.user) return {ok:false,supabase,user:null};
  const {data:profile}=await supabase.from('profiles').select('role').eq('id',data.user.id).maybeSingle();
  return {ok:profile?.role==='admin',supabase,user:data.user};
}

export async function GET(){
  const a=await admin(); if(!a.ok) return Response.json({error:'Unauthorized'},{status:401});
  const {data,error}=await a.supabase.from('busy_blocks').select('*').eq('host_slug',process.env.HOST_SLUG||'manhthanh').gte('end_at',new Date().toISOString()).order('start_at');
  if(error) return Response.json({error:error.message},{status:400});
  return Response.json({items:data||[]});
}

const schema=z.object({title:z.string().optional(),start:z.string().datetime({offset:true}),end:z.string().datetime({offset:true})});
export async function POST(req:Request){
  const a=await admin(); if(!a.ok) return Response.json({error:'Unauthorized'},{status:401});
  const body=schema.parse(await req.json());
  const {data,error}=await a.supabase.from('busy_blocks').insert({
    owner_id:a.user!.id,
    host_slug:process.env.HOST_SLUG||'manhthanh',
    title:body.title||'Bận',
    start_at:body.start,
    end_at:body.end
  }).select('*').single();
  if(error) return Response.json({error:error.message},{status:400});
  return Response.json({item:data});
}
export async function DELETE(req:Request){
  const a=await admin(); if(!a.ok) return Response.json({error:'Unauthorized'},{status:401});
  const {id}=z.object({id:z.string().uuid()}).parse(await req.json());
  const {error}=await a.supabase.from('busy_blocks').delete().eq('id',id);
  if(error) return Response.json({error:error.message},{status:400});
  return Response.json({ok:true});
}

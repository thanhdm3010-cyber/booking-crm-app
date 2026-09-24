import { NextRequest } from "next/server";
import { config } from "@/lib/config";
import { getAvailability, getBusyBlocks, getPublicBookedSlots } from "@/lib/store";
import { getGoogleBusy } from "@/lib/calendar";

function iso(date:string,time:string) {
  return `${date}T${time.slice(0,5)}:00+07:00`;
}
function overlaps(aStart:string,aEnd:string,bStart:string,bEnd:string){
  return new Date(aStart).getTime() < new Date(bEnd).getTime() &&
         new Date(aEnd).getTime() > new Date(bStart).getTime();
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");
  const slug = request.nextUrl.searchParams.get("slug");
  if (!date || slug !== config.hostSlug) return Response.json({ error: "Invalid request" }, { status: 400 });

  const target = new Date(`${date}T12:00:00+07:00`);
  const weekday = target.getDay();
  const dayStart = `${date}T00:00:00+07:00`;
  const dayEnd = `${date}T23:59:59+07:00`;

  const [windows, booked, manualBusy, googleBusy] = await Promise.all([
    getAvailability(slug,weekday),
    getPublicBookedSlots(dayStart,dayEnd),
    getBusyBlocks(slug,dayStart,dayEnd),
    getGoogleBusy(dayStart,dayEnd)
  ]);

  const blocked = [
    ...booked.map((x:any)=>({start:x.start_at,end:x.end_at})),
    ...manualBusy.map((x:any)=>({start:x.start_at,end:x.end_at})),
    ...googleBusy.map((x:any)=>({start:x.start!,end:x.end!}))
  ];

  const slots:any[] = [];
  for (const w of windows) {
    const startMin = Number(w.start_time.slice(0,2))*60 + Number(w.start_time.slice(3,5));
    const endMin = Number(w.end_time.slice(0,2))*60 + Number(w.end_time.slice(3,5));
    const step = config.durationMinutes + config.bufferMinutes;
    for (let mins=startMin; mins+config.durationMinutes<=endMin; mins+=step) {
      const h=Math.floor(mins/60), m=mins%60;
      const eh=Math.floor((mins+config.durationMinutes)/60), em=(mins+config.durationMinutes)%60;
      const start=iso(date,`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
      const end=iso(date,`${String(eh).padStart(2,"0")}:${String(em).padStart(2,"0")}`);
      const busy=blocked.some((b:any)=>overlaps(start,end,b.start,b.end));
      if(!busy && new Date(start).getTime()>Date.now()) {
        slots.push({start,end,label:`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`});
      }
    }
  }

  return Response.json({ slots });
}

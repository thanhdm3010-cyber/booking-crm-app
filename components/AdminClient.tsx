"use client";
import { useEffect, useMemo, useState } from "react";

const stages=["booked","attended","follow_up","interested","customer","lost"];
const dayNames=["CN","Thứ 2","Thứ 3","Thứ 4","Thứ 5","Thứ 6","Thứ 7"];

export default function AdminClient(){
 const [rows,setRows]=useState<any[]>([]);
 const [availability,setAvailability]=useState<any[]>([]);
 const [busy,setBusy]=useState<any[]>([]);
 const [err,setErr]=useState("");

 async function load(){
   const [rb,ra,rbusy]=await Promise.all([
     fetch("/api/admin/bookings"),
     fetch("/api/admin/availability"),
     fetch("/api/admin/busy-blocks")
   ]);
   const [db,da,dbusy]=await Promise.all([rb.json(),ra.json(),rbusy.json()]);
   if(!rb.ok){setErr(db.error||"Không thể tải booking");return}
   setRows(db.bookings||[]);
   if(ra.ok) setAvailability(da.items||[]);
   if(rbusy.ok) setBusy(dbusy.items||[]);
   setErr("");
 }
 useEffect(()=>{load()},[]);

 async function stage(id:string,crmStage:string){
   const r=await fetch("/api/admin/bookings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,crmStage})});
   if(!r.ok){setErr("Không thể cập nhật");return}
   load();
 }

 async function addAvailability(fd:FormData){
   const payload={weekday:Number(fd.get("weekday")),startTime:String(fd.get("startTime")),endTime:String(fd.get("endTime")),isActive:true};
   const r=await fetch("/api/admin/availability",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const d=await r.json(); if(!r.ok){setErr(d.error||"Không thể thêm giờ làm việc");return} load();
 }
 async function deleteAvailability(id:string){
   await fetch("/api/admin/availability",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})}); load();
 }

 async function addBusy(fd:FormData){
   const startLocal=String(fd.get("start"));
   const endLocal=String(fd.get("end"));
   const payload={title:String(fd.get("title")||"Bận"),start:new Date(startLocal).toISOString(),end:new Date(endLocal).toISOString()};
   const r=await fetch("/api/admin/busy-blocks",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
   const d=await r.json(); if(!r.ok){setErr(d.error||"Không thể thêm lịch bận");return} load();
 }
 async function deleteBusy(id:string){
   await fetch("/api/admin/busy-blocks",{method:"DELETE",headers:{"Content-Type":"application/json"},body:JSON.stringify({id})}); load();
 }

 const k=useMemo(()=>({
   total:rows.length,
   confirmed:rows.filter(x=>x.status==="confirmed").length,
   attended:rows.filter(x=>["attended","follow_up","interested","customer"].includes(x.crmStage)).length,
   customers:rows.filter(x=>x.crmStage==="customer").length
 }),[rows]);

 return <>
 {err&&<div className="error">{err}</div>}
 <div className="kpis">
   <div className="kpi"><span>Booking</span><strong>{k.total}</strong></div>
   <div className="kpi"><span>Xác nhận</span><strong>{k.confirmed}</strong></div>
   <div className="kpi"><span>Đã tham dự+</span><strong>{k.attended}</strong></div>
   <div className="kpi"><span>Khách hàng</span><strong>{k.customers}</strong></div>
 </div>

 <div className="grid" style={{marginBottom:24}}>
  <div className="card">
   <div className="eyebrow">Lịch làm việc</div><h2>Khung giờ nhận lịch</h2>
   <form action={addAvailability}>
    <label>Ngày</label>
    <select name="weekday" defaultValue="1">{dayNames.map((d,i)=><option key={i} value={i}>{d}</option>)}</select>
    <label>Bắt đầu</label><input name="startTime" type="time" defaultValue="09:00" required/>
    <label>Kết thúc</label><input name="endTime" type="time" defaultValue="17:00" required/>
    <button className="primary">THÊM KHUNG GIỜ</button>
   </form>
   <div style={{marginTop:16}}>
    {availability.map(a=><div key={a.id} style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"1px solid var(--line)"}}>
      <span>{dayNames[a.weekday]} · {String(a.start_time).slice(0,5)}–{String(a.end_time).slice(0,5)}</span>
      <button onClick={()=>deleteAvailability(a.id)}>Xóa</button>
    </div>)}
   </div>
  </div>

  <div className="card">
   <div className="eyebrow">Lịch bận</div><h2>Chặn thời gian trước</h2>
   <form action={addBusy}>
    <label>Tên lịch bận</label><input name="title" placeholder="Ví dụ: Đi đào tạo"/>
    <label>Bắt đầu</label><input name="start" type="datetime-local" required/>
    <label>Kết thúc</label><input name="end" type="datetime-local" required/>
    <button className="primary">THÊM LỊCH BẬN</button>
   </form>
   <div style={{marginTop:16}}>
    {busy.map(b=><div key={b.id} style={{padding:"10px 0",borderBottom:"1px solid var(--line)"}}>
      <strong>{b.title||"Bận"}</strong><br/>
      <span className="muted">{new Date(b.start_at).toLocaleString("vi-VN")} → {new Date(b.end_at).toLocaleString("vi-VN")}</span>
      <div><button onClick={()=>deleteBusy(b.id)}>Xóa</button></div>
    </div>)}
   </div>
  </div>
 </div>

 <div className="card" style={{overflowX:"auto"}}>
 <table><thead><tr><th>Khách</th><th>Thời gian</th><th>Nguồn</th><th>Trạng thái</th><th>CRM</th></tr></thead>
 <tbody>{rows.map(b=><tr key={b.id}>
   <td><strong>{b.customerName}</strong><br/><span className="muted">{b.customerEmail}</span></td>
   <td>{new Date(b.start).toLocaleString("vi-VN")}</td><td>{b.source||"direct"}</td><td>{b.status}</td>
   <td><select value={b.crmStage} onChange={e=>stage(b.id,e.target.value)}>{stages.map(s=><option key={s} value={s}>{s}</option>)}</select></td>
 </tr>)}</tbody></table>
 </div>
 </>
}

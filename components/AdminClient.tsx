"use client";
import { useEffect, useMemo, useState } from "react";
const stages=["booked","attended","follow_up","interested","customer","lost"];
export default function AdminClient(){
 const [rows,setRows]=useState<any[]>([]); const [err,setErr]=useState("");
 async function load(){const r=await fetch("/api/admin/bookings"); const d=await r.json(); if(!r.ok){setErr(d.error||"Không thể tải");return} setRows(d.bookings||[]);setErr("")}
 useEffect(()=>{load()},[]);
 async function stage(id:string,crmStage:string){const r=await fetch("/api/admin/bookings",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({id,crmStage})}); if(!r.ok){setErr("Không thể cập nhật");return} load()}
 const k=useMemo(()=>({total:rows.length,confirmed:rows.filter(x=>x.status==="confirmed").length,attended:rows.filter(x=>["attended","follow_up","interested","customer"].includes(x.crmStage)).length,customers:rows.filter(x=>x.crmStage==="customer").length}),[rows]);
 return <>{err&&<div className="error">{err}</div>}<div className="kpis"><div className="kpi"><span>Booking</span><strong>{k.total}</strong></div><div className="kpi"><span>Xác nhận</span><strong>{k.confirmed}</strong></div><div className="kpi"><span>Đã tham dự+</span><strong>{k.attended}</strong></div><div className="kpi"><span>Khách hàng</span><strong>{k.customers}</strong></div></div><div className="card" style={{overflowX:"auto"}}><table><thead><tr><th>Khách</th><th>Thời gian</th><th>Nguồn</th><th>Trạng thái</th><th>CRM</th></tr></thead><tbody>{rows.map(b=><tr key={b.id}><td><strong>{b.customerName}</strong><br/><span className="muted">{b.customerEmail}</span></td><td>{new Date(b.start).toLocaleString("vi-VN")}</td><td>{b.source||"direct"}</td><td>{b.status}</td><td><select value={b.crmStage} onChange={e=>stage(b.id,e.target.value)}>{stages.map(s=><option key={s} value={s}>{s}</option>)}</select></td></tr>)}</tbody></table></div></>
}

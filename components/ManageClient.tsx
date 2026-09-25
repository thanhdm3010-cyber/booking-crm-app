"use client";
import { useEffect, useState } from "react";

type B = any;
export default function ManageClient({ token }: { token: string }) {
  const [b,setB]=useState<B|null>(null); const [msg,setMsg]=useState("");
  async function load(){const r=await fetch(`/api/manage/${token}`); const d=await r.json(); setB(d.booking||null)}
  useEffect(()=>{load()},[]);
  async function cancel(){ if(!confirm("Bạn chắc chắn muốn hủy lịch?")) return; const r=await fetch(`/api/manage/${token}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"cancel"})}); const d=await r.json(); setMsg(r.ok?"Đã hủy lịch thành công.":d.error); load(); }
  if(!b) return <div className="card">Đang tải lịch hẹn...</div>;
  return <div className="card"><div className="eyebrow">Quản lý lịch hẹn</div><h2>{b.customerName}</h2><p><strong>Thời gian:</strong> {new Date(b.start).toLocaleString("vi-VN")}</p><p><strong>Trạng thái:</strong> {b.status}</p>{b.meetUrl&&<p><a href={b.meetUrl} target="_blank" rel="noreferrer"><strong>Mở Zoom →</strong></a></p>}{b.status==="confirmed"&&<><p><a href={`/${b.hostSlug}`}><strong>Chọn lịch mới →</strong></a></p><button className="danger" onClick={cancel}>HỦY LỊCH</button></>}{msg&&<div className="success">{msg}</div>}</div>
}

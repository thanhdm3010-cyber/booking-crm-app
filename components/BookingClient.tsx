"use client";

import { useEffect, useMemo, useState } from "react";

type Slot = { start: string; end: string; label: string };

function nextDays(count = 7) {
  const days = [];
  const base = new Date();
  for (let i = 1; i <= count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    days.push(d);
  }
  return days;
}

export default function BookingClient({ slug, hostName }: { slug: string; hostName: string }) {
  const days = useMemo(() => nextDays(7), []);
  const [date, setDate] = useState(days[0].toISOString().slice(0, 10));
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selected, setSelected] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  async function loadSlots(d: string) {
    setSelected(null);
    const res = await fetch(`/api/slots?date=${d}&slug=${slug}`);
    const data = await res.json();
    setSlots(data.slots || []);
  }

  useEffect(() => { loadSlots(date); }, [date]);

  async function submit(formData: FormData) {
    if (!selected) return;
    setLoading(true);
    setMessage(null);

    const payload = {
      hostSlug: slug,
      customerName: formData.get("name"),
      customerEmail: formData.get("email"),
      customerPhone: formData.get("phone"),
      note: formData.get("note"),
      source: new URLSearchParams(window.location.search).get("utm_source") || "direct",
      campaign: new URLSearchParams(window.location.search).get("utm_campaign") || undefined,
      start: selected.start,
      end: selected.end
    };

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage({ type: "error", text: data.error || "Không thể đặt lịch." });
      await loadSlots(date);
      return;
    }

    setMessage({
      type: "ok",
      text: data.meetUrl
        ? `Đặt lịch thành công. Google Meet: ${data.meetUrl}`
        : `Đặt lịch thành công. Bạn có thể quản lý lịch tại /manage/${data.manageToken}`
    });
    await loadSlots(date);
  }

  return (
    <div className="grid">
      <section className="card">
        <div className="eyebrow">Chọn thời gian</div>
        <h2>{hostName}</h2>
        <p className="muted">Tư vấn 1:1 · 45 phút · Múi giờ Việt Nam</p>

        <div className="days">
          {days.map((d) => {
            const value = d.toISOString().slice(0, 10);
            return (
              <button
                key={value}
                className={`day ${date === value ? "active" : ""}`}
                onClick={() => setDate(value)}
              >
                <div>{d.toLocaleDateString("vi-VN", { weekday: "short" })}</div>
                <strong>{d.getDate()}</strong>
              </button>
            );
          })}
        </div>

        <div className="slots">
          {slots.length === 0 && <p className="muted">Ngày này không còn khung giờ trống.</p>}
          {slots.map((s) => (
            <button
              key={s.start}
              className={`slot ${selected?.start === s.start ? "active" : ""}`}
              onClick={() => setSelected(s)}
            >
              {s.label}
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="eyebrow">Thông tin khách hàng</div>
        <h2>Xác nhận cuộc hẹn</h2>
        <p className="muted">
          {selected ? `Bạn đang chọn ${selected.label}.` : "Hãy chọn một khung giờ ở bên trái."}
        </p>

        <form action={submit}>
          <label>Họ và tên *</label>
          <input name="name" required placeholder="Nguyễn Văn A" />

          <label>Email *</label>
          <input name="email" type="email" required placeholder="ban@email.com" />

          <label>Số điện thoại</label>
          <input name="phone" placeholder="09..." />

          <label>Bạn muốn trao đổi điều gì?</label>
          <textarea name="note" placeholder="Mô tả ngắn nhu cầu của bạn..." />

          <button className="primary" disabled={!selected || loading}>
            {loading ? "Đang đặt lịch..." : "XÁC NHẬN ĐẶT LỊCH"}
          </button>
        </form>

        {message?.type === "ok" && <div className="success">{message.text}</div>}
        {message?.type === "error" && <div className="error">{message.text}</div>}
      </section>
    </div>
  );
}

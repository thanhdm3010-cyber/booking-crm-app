import { config } from "@/lib/config";

export default function HomePage() {
  return (
    <main className="container">
      <div className="hero">
        <div className="eyebrow">Booking MVP</div>
        <h1>Đặt lịch đơn giản.<br/>Tự động xác nhận.</h1>
        <p className="muted">
          Bản MVP cho phép khách chọn lịch, hệ thống chống trùng giờ,
          gửi email và tạo Google Calendar/Meet khi đã cấu hình.
        </p>
      </div>
      <div className="card">
        <h2>Trang đặt lịch mẫu</h2>
        <p className="muted">Host: {config.hostName} · 45 phút / cuộc hẹn</p>
        <p><a href={`/${config.hostSlug}`}><strong>Mở trang booking →</strong></a></p>
        <p><a href="/admin">Mở dashboard →</a></p>
      </div>
    </main>
  );
}

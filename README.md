# Booking CRM App

Webapp đặt lịch 1:1 theo luồng:

**Booking → Email → Google Calendar → Google Meet → Reminder → CRM → Dashboard**

## Đã có

- Trang booking cá nhân `/manhthanh`
- Chọn ngày và slot còn trống
- Chống đặt trùng ở server
- Thu thập họ tên, email, SĐT và nhu cầu
- Ghi nhận `utm_source`, `utm_campaign`
- Supabase Database + RLS
- Supabase Auth cho trang admin
- Trang quản lý booking theo token
- Hủy / đổi lịch
- CRM stages
- Dashboard admin
- Cron endpoint cho reminder
- Tích hợp sẵn Resend và Google Calendar/Meet qua biến môi trường

## Chạy local

```bash
npm install
cp .env.example .env.local
npm run dev
```

## Route chính

```text
/manhthanh
/login
/admin
/manage/[token]

GET  /api/slots
POST /api/bookings
GET  /api/manage/[token]
PATCH /api/manage/[token]
GET  /api/admin/bookings
PATCH /api/admin/bookings
POST /api/reminders
```

## Biến môi trường

Xem file `.env.example`.

Không commit secret server-side vào repository.

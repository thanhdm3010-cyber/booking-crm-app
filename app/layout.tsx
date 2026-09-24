import "./styles.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Booking MVP",
  description: "Đặt lịch tư vấn nhanh"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

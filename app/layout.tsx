import "./styles.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Đặt lịch coaching cùng Đỗ Mạnh Thành",
  description: "Đặt lịch tư vấn nhanh"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}

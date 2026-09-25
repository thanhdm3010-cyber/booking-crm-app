import BookingClient from "@/components/BookingClient";
import { config } from "@/lib/config";
import { brandLogo } from "@/lib/brandAssets";
import { notFound } from "next/navigation";

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== config.hostSlug) notFound();

  return (
    <main className="container booking-shell">
      <header className="brandbar booking-topbar">
        <img src={brandLogo} alt="ANLIFE - Kiến tạo giá trị sống" className="brand-logo" />
        <nav className="topnav" aria-label="Điều hướng">
          <span>Về Thành</span>
          <span>Coaching 1:1</span>
          <span>Câu hỏi thường gặp</span>
          <a className="topnav-cta" href="#booking-flow">Đặt lịch ngay</a>
        </nav>
      </header>

      <BookingClient slug={slug} hostName={config.hostName} />
    </main>
  );
}

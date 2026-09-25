import BookingClient from "@/components/BookingClient";
import { config } from "@/lib/config";
import { brandLogo, brandPortrait } from "@/lib/brandAssets";
import { notFound } from "next/navigation";

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== config.hostSlug) notFound();

  return (
    <main className="container booking-shell">
      <header className="brandbar">
        <img src={brandLogo} alt="ANLIFE - Kiến tạo giá trị sống" className="brand-logo" />
        <div className="brand-note">Tư vấn 1:1 · Xây thương hiệu cá nhân</div>
      </header>

      <section className="brand-hero">
        <div className="brand-copy">
          <div className="hero-pill">TƯ VẤN 1:1 CÙNG ĐỖ MẠNH THÀNH</div>
          <h1>Đặt lịch tư vấn cùng <span>Đỗ Mạnh Thành</span></h1>
          <p>
            Làm rõ mục tiêu, xác định hướng đi và chuẩn bị một kế hoạch phù hợp
            để xây kênh, phát triển thương hiệu cá nhân và tạo ra cơ hội kinh doanh.
          </p>
          <div className="benefit-row">
            <div><b>01</b><span>Khảo sát trước để hiểu đúng vấn đề</span></div>
            <div><b>02</b><span>Chọn lịch phù hợp với thời gian của anh/chị</span></div>
            <div><b>03</b><span>Trao đổi tập trung, thực tế và dễ áp dụng</span></div>
          </div>
        </div>
        <div className="brand-photo-wrap">
          <div className="brand-photo-bg"></div>
          <img src={brandPortrait} alt="Đỗ Mạnh Thành" className="brand-photo" />
        </div>
      </section>

      <BookingClient slug={slug} hostName={config.hostName} />
    </main>
  );
}

import BookingClient from "@/components/BookingClient";
import { config } from "@/lib/config";
import { notFound } from "next/navigation";

export default async function BookingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug !== config.hostSlug) notFound();

  return (
    <main className="container">
      <div className="hero">
        <div className="eyebrow">Đặt lịch tư vấn</div>
        <h1>Chọn thời gian phù hợp với bạn.</h1>
        <p className="muted">
          Sau khi xác nhận, hệ thống sẽ gửi thông tin lịch hẹn cho cả hai bên.
        </p>
      </div>
      <BookingClient slug={slug} hostName={config.hostName} />
    </main>
  );
}

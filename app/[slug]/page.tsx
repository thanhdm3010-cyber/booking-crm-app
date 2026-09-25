import BookingClient from "@/components/BookingClient";
import { config } from "@/lib/config";
import { brandLogo } from "@/lib/brandAssets";
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

      <BookingClient slug={slug} hostName={config.hostName} />
    </main>
  );
}

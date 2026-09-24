import { redirect } from 'next/navigation';
import AdminClient from '@/components/AdminClient';
import { createClient } from '@/lib/supabase/server';

export default async function AdminPage(){
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');
  return <main className="container"><div className="hero"><div className="eyebrow">CRM + Funnel</div><h1>Booking Dashboard</h1><p className="muted">Theo dõi booking, nguồn lead và trạng thái chuyển đổi.</p></div><AdminClient/></main>
}

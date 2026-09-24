import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

async function login(formData: FormData) {
  'use server';
  const email = String(formData.get('email') || '');
  const password = String(formData.get('password') || '');
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect('/login?error=1');
  redirect('/admin');
}

export default async function LoginPage({searchParams}:{searchParams:Promise<{error?:string}>}) {
  const q = await searchParams;
  return <main className="container"><div className="card" style={{maxWidth:520,margin:'60px auto'}}>
    <div className="eyebrow">Admin</div><h1 style={{fontSize:38}}>Đăng nhập</h1>
    <form action={login}>
      <label>Email</label><input name="email" type="email" required />
      <label>Mật khẩu</label><input name="password" type="password" required />
      <button className="primary">ĐĂNG NHẬP</button>
    </form>
    {q.error && <div className="error">Email hoặc mật khẩu chưa đúng.</div>}
  </div></main>
}

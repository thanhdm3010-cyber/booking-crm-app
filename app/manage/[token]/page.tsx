import ManageClient from "@/components/ManageClient";
export default async function Page({params}:{params:Promise<{token:string}>}){const {token}=await params;return <main className="container"><div className="hero"><div className="eyebrow">Booking</div><h1>Quản lý cuộc hẹn</h1></div><ManageClient token={token}/></main>}

"use client";
import { useEffect, useMemo, useState } from "react";

type Slot={start:string;end:string;label:string};
const field=(fd:FormData,name:string)=>String(fd.get(name)||"");
const multi=(fd:FormData,name:string)=>fd.getAll(name).map(String);

function nextDays(count=7){
  const days=[]; const base=new Date();
  for(let i=1;i<=count;i++){const d=new Date(base);d.setDate(base.getDate()+i);days.push(d)}
  return days;
}

export default function BookingClient({slug,hostName}:{slug:string;hostName:string}){
  const days=useMemo(()=>nextDays(7),[]);
  const [step,setStep]=useState<1|2>(1);
  const [survey,setSurvey]=useState<any>(null);
  const [date,setDate]=useState(days[0].toISOString().slice(0,10));
  const [slots,setSlots]=useState<Slot[]>([]);
  const [selected,setSelected]=useState<Slot|null>(null);
  const [loading,setLoading]=useState(false);
  const [message,setMessage]=useState<{type:"ok"|"error";text:string}|null>(null);

  async function loadSlots(d:string){
    setSelected(null);
    const res=await fetch(`/api/slots?date=${d}&slug=${slug}`);
    const data=await res.json();
    setSlots(data.slots||[]);
  }
  useEffect(()=>{if(step===2) loadSlots(date)},[date,step]);

  function completeSurvey(fd:FormData){
    const data={
      name:field(fd,"name"),
      email:field(fd,"email"),
      phone:field(fd,"phone"),
      field:field(fd,"field"),
      products:multi(fd,"products"),
      goals:multi(fd,"goals"),
      rememberedAs:multi(fd,"rememberedAs"),
      strengths:multi(fd,"strengths"),
      customerAges:multi(fd,"customerAges"),
      customerJobs:multi(fd,"customerJobs"),
      customerGender:field(fd,"customerGender"),
      customerAreas:multi(fd,"customerAreas"),
      customerProblems:multi(fd,"customerProblems"),
      solutionProblems:multi(fd,"solutionProblems"),
      customerResults:multi(fd,"customerResults"),
      differentiation:multi(fd,"differentiation"),
      experiences:multi(fd,"experiences"),
      contentPillars:multi(fd,"contentPillars"),
      dailyTime:field(fd,"dailyTime"),
      videosPerWeek:field(fd,"videosPerWeek"),
      postsPerWeek:field(fd,"postsPerWeek"),
      commitment:field(fd,"commitment"),
      quittingRisks:multi(fd,"quittingRisks"),
      dreamChannel:multi(fd,"dreamChannel"),
      yearResults:multi(fd,"yearResults"),
      revenueGoal:field(fd,"revenueGoal"),
      productName:field(fd,"productName"),
      rememberOther:field(fd,"rememberOther"),
      notes:field(fd,"notes")
    };
    if(!data.name || !data.email || !data.field || data.goals.length===0){
      setMessage({type:"error",text:"Vui lòng hoàn thành các câu hỏi bắt buộc trước khi tiếp tục."}); return;
    }
    setSurvey(data); setMessage(null); setStep(2);
  }

  async function book(){
    if(!selected||!survey) return;
    setLoading(true); setMessage(null);
    const payload={
      hostSlug:slug, customerName:survey.name, customerEmail:survey.email, customerPhone:survey.phone,
      note:survey.notes, surveyData:survey,
      source:new URLSearchParams(window.location.search).get("utm_source")||"direct",
      campaign:new URLSearchParams(window.location.search).get("utm_campaign")||undefined,
      start:selected.start,end:selected.end
    };
    const res=await fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await res.json(); setLoading(false);
    if(!res.ok){setMessage({type:"error",text:data.error||"Không thể đặt lịch."});await loadSlots(date);return}
    setMessage({type:"ok",text:"Đặt lịch thành công. Thông tin khảo sát và lịch hẹn đã được lưu."});
  }

  const CheckboxGroup=({name,options}:{name:string;options:string[]})=><div className="checkgrid">{options.map(o=><label className="check" key={o}><input type="checkbox" name={name} value={o}/><span>{o}</span></label>)}</div>;

  if(step===1) return <section className="card survey-card">
    <div className="eyebrow">Bước 1/2 · Khảo sát trước buổi tư vấn</div>
    <h2>Giúp Thành hiểu rõ hơn về anh/chị</h2>
    <p className="muted">Mất khoảng 5–7 phút. Hoàn thành khảo sát trước, sau đó hệ thống mới mở phần chọn lịch.</p>
    <form action={completeSurvey}>
      <h3>Thông tin cơ bản</h3>
      <label>Họ và tên *</label><input name="name" required/>
      <label>Email *</label><input name="email" type="email" required/>
      <label>Số điện thoại</label><input name="phone"/>
      <label>Lĩnh vực anh/chị đang hoạt động *</label>
      <select name="field" required defaultValue=""><option value="" disabled>Chọn lĩnh vực</option>{["Kinh doanh/Bán hàng","Marketing/Truyền thông","Giáo dục/Đào tạo","Sức khỏe/Wellness","Làm đẹp","Bất động sản","Tài chính/Bảo hiểm","Công nghệ/IT","Nội thất/Xây dựng","Ô tô","F&B","Dịch vụ chuyên môn","Nghệ thuật/Sáng tạo","Khác"].map(x=><option key={x}>{x}</option>)}</select>
      <label>Tên sản phẩm/dịch vụ cụ thể</label><input name="productName" placeholder="Nếu chưa có, có thể để trống"/>
      <label>Loại sản phẩm/dịch vụ đang cung cấp</label><CheckboxGroup name="products" options={["Sản phẩm vật lý","Dịch vụ","Tư vấn/Coaching","Khóa học/Đào tạo","Membership/Cộng đồng","Affiliate","Phần mềm/Công nghệ","Chưa có sản phẩm","Khác"]}/>

      <h3>Mục tiêu & định vị</h3>
      <label>Anh/chị muốn xây kênh để đạt mục tiêu gì? *</label><CheckboxGroup name="goals" options={["Xây thương hiệu cá nhân","Tìm kiếm khách hàng","Bán sản phẩm/dịch vụ","Tăng uy tín chuyên gia","Chia sẻ kiến thức","Xây cộng đồng","Tìm đối tác","Tuyển dụng/xây đội nhóm","Phát triển sự nghiệp","Tạo thêm nguồn thu"]}/>
      <label>Anh/chị muốn được nhớ đến là người như thế nào?</label><CheckboxGroup name="rememberedAs" options={["Chuyên gia","Đáng tin cậy","Tận tâm","Thực tế","Truyền cảm hứng","Sáng tạo","Có chiều sâu","Kỷ luật","Tử tế","Khác"]}/>
      <input name="rememberOther" placeholder="Mô tả thêm nếu cần"/>
      <label>Anh/chị có thể giúp người khác tốt hơn ở điều gì?</label><CheckboxGroup name="strengths" options={["Kiến thức chuyên môn","Kinh nghiệm thực tế","Giải quyết vấn đề","Hướng dẫn từng bước","Truyền động lực","Tư duy/định hướng","Kỹ năng nghề nghiệp","Kết nối nguồn lực","Khác"]}/>

      <h3>Khách hàng mục tiêu</h3>
      <label>Độ tuổi khách hàng</label><CheckboxGroup name="customerAges" options={["Dưới 18","18–24","25–34","35–44","45–54","55+"]}/>
      <label>Nghề nghiệp khách hàng</label><CheckboxGroup name="customerJobs" options={["Học sinh/Sinh viên","Nhân viên văn phòng","Chuyên gia","Freelancer","Chủ kinh doanh","Chủ doanh nghiệp","Quản lý/Lãnh đạo","Nội trợ","Người nghỉ hưu","Khác"]}/>
      <label>Giới tính khách hàng</label><select name="customerGender"><option>Cả nam và nữ</option><option>Nam</option><option>Nữ</option><option>Không xác định cụ thể</option></select>
      <label>Khu vực khách hàng</label><CheckboxGroup name="customerAreas" options={["Hà Nội","TP.HCM","Các tỉnh/thành khác","Toàn quốc","Việt Nam ở nước ngoài","Quốc tế"]}/>
      <label>Vấn đề lớn nhất khách hàng đang gặp</label><CheckboxGroup name="customerProblems" options={["Thiếu kiến thức","Thiếu kỹ năng","Thiếu thời gian","Thiếu tiền/nguồn lực","Thiếu khách hàng","Không biết bắt đầu từ đâu","Không duy trì được","Thiếu tự tin","Quá nhiều thông tin nhưng không biết làm gì","Chưa tìm được giải pháp phù hợp","Khác"]}/>
      <label>Sản phẩm/dịch vụ giải quyết nhóm vấn đề nào?</label><CheckboxGroup name="solutionProblems" options={["Tăng doanh thu","Tiết kiệm thời gian","Giảm chi phí","Cải thiện sức khỏe","Phát triển kỹ năng","Phát triển sự nghiệp","Cải thiện mối quan hệ","Nâng cao hiệu suất","Giải quyết vấn đề chuyên môn","Khác"]}/>
      <label>Kết quả khách hàng có thể nhận được</label><CheckboxGroup name="customerResults" options={["Có kiến thức rõ ràng hơn","Có quy trình cụ thể","Tiết kiệm thời gian","Tăng doanh thu","Có thêm khách hàng","Tăng năng suất","Cải thiện sức khỏe","Tăng sự tự tin","Có kết quả đo lường được","Khác"]}/>

      <h3>Chất liệu xây kênh</h3>
      <label>Điểm khác biệt của anh/chị</label><CheckboxGroup name="differentiation" options={["Nhiều năm kinh nghiệm","Có kết quả thực tế","Có phương pháp riêng","Có câu chuyện cá nhân","Chuyên môn sâu","Dịch vụ tận tâm","Hiểu khách hàng","Có cộng đồng","Có hệ thống/quy trình","Phong cách cá nhân khác biệt","Khác"]}/>
      <label>Trải nghiệm có thể trở thành chất liệu xây kênh</label><CheckboxGroup name="experiences" options={["Từng thất bại","Từng mất phương hướng","Từng thay đổi nghề nghiệp","Từng vượt qua khó khăn tài chính","Từng thay đổi sức khỏe","Từng khởi nghiệp","Từng xây lại từ đầu","Từng đạt thành tựu nổi bật","Có nhiều case khách hàng","Chưa xác định được"]}/>
      <label>Nhóm nội dung muốn xây dựng (chọn 3–5)</label><CheckboxGroup name="contentPillars" options={["Chuyên môn","Case study","Câu chuyện cá nhân","Tư duy/phát triển bản thân","Hướng dẫn thực hành","Giải đáp câu hỏi","Phân tích xu hướng","Review công cụ/sản phẩm","Behind the scenes","Quan điểm cá nhân","Lifestyle liên quan định vị"]}/>

      <h3>Cam kết thực hiện</h3>
      <label>Thời gian có thể dành mỗi ngày</label><select name="dailyTime">{["Dưới 30 phút","30–60 phút","1–2 giờ","2–3 giờ","Trên 3 giờ"].map(x=><option key={x}>{x}</option>)}</select>
      <label>Số video mỗi tuần</label><select name="videosPerWeek">{["1","2–3","4–5","6–7","Trên 7"].map(x=><option key={x}>{x}</option>)}</select>
      <label>Số bài viết mỗi tuần</label><select name="postsPerWeek">{["1","2–3","4–5","6–7","8–14","Trên 14"].map(x=><option key={x}>{x}</option>)}</select>
      <label>Thời gian cam kết duy trì</label><select name="commitment">{["21 ngày","3 tháng","6 tháng","12 tháng","Trên 12 tháng"].map(x=><option key={x}>{x}</option>)}</select>
      <label>Điều dễ khiến anh/chị bỏ cuộc nhất</label><CheckboxGroup name="quittingRisks" options={["Ít view","Không có khách hàng","Không biết làm nội dung gì","Thiếu thời gian","Ngại xuất hiện","Sợ bị đánh giá","Không thấy kết quả nhanh","Thiếu kỷ luật","Không biết quay/edit","Dùng AI nhưng nội dung không đúng chất mình"]}/>

      <h3>Bức tranh 12 tháng</h3>
      <label>Nếu không bị giới hạn, anh/chị muốn xây kênh như thế nào?</label><CheckboxGroup name="dreamChannel" options={["Kênh chuyên gia","Kênh giáo dục/chia sẻ","Kênh bán hàng","Kênh cộng đồng","Kênh truyền cảm hứng","Kênh lifestyle gắn chuyên môn","Kênh media lớn","Kênh hỗ trợ mô hình kinh doanh cá nhân"]}/>
      <label>Sau 12 tháng, anh/chị mong muốn kết quả gì?</label><CheckboxGroup name="yearResults" options={["10.000+ follower","50.000+ follower","100.000+ follower","Có khách hàng đều mỗi tháng","Có thương hiệu cá nhân rõ ràng","Có sản phẩm riêng","Có cộng đồng riêng","Có doanh thu từ kênh","Có đội nhóm","Trở thành chuyên gia được biết đến"]}/>
      <label>Mục tiêu doanh thu từ kênh sau 12 tháng</label><select name="revenueGoal">{["Chưa đặt mục tiêu","Dưới 20 triệu/tháng","20–50 triệu/tháng","50–100 triệu/tháng","100–300 triệu/tháng","Trên 300 triệu/tháng"].map(x=><option key={x}>{x}</option>)}</select>
      <label>Điều anh/chị muốn Thành hiểu thêm trước buổi tư vấn</label><textarea name="notes" placeholder="Có thể để trống"/>
      <button className="primary">HOÀN THÀNH KHẢO SÁT → CHỌN LỊCH</button>
    </form>
    {message?.type==="error"&&<div className="error">{message.text}</div>}
  </section>;

  return <div>
    <div className="survey-summary card">
      <div><div className="eyebrow">Bước 2/2 · Chọn lịch</div><strong>{survey?.name}</strong> · {survey?.field}</div>
      <button onClick={()=>setStep(1)}>Sửa khảo sát</button>
    </div>
    <div className="grid">
      <section className="card">
        <div className="eyebrow">Chọn thời gian</div><h2>{hostName}</h2>
        <p className="muted">Tư vấn 1:1 · 45 phút · Múi giờ Việt Nam</p>
        <div className="days">{days.map(d=>{const value=d.toISOString().slice(0,10);return <button key={value} className={`day ${date===value?"active":""}`} onClick={()=>setDate(value)}><div>{d.toLocaleDateString("vi-VN",{weekday:"short"})}</div><strong>{d.getDate()}</strong></button>})}</div>
        <div className="slots">{slots.length===0&&<p className="muted">Ngày này không còn khung giờ trống.</p>}{slots.map(s=><button key={s.start} className={`slot ${selected?.start===s.start?"active":""}`} onClick={()=>setSelected(s)}>{s.label}</button>)}</div>
      </section>
      <section className="card">
        <div className="eyebrow">Xác nhận</div><h2>Hoàn tất đặt lịch</h2>
        <p className="muted">{selected?`Bạn đang chọn ${selected.label}.`:"Hãy chọn một khung giờ ở bên trái."}</p>
        <p><strong>{survey?.name}</strong><br/>{survey?.email}<br/>{survey?.phone}</p>
        <button className="primary" disabled={!selected||loading} onClick={book}>{loading?"Đang đặt lịch...":"XÁC NHẬN ĐẶT LỊCH"}</button>
        {message?.type==="ok"&&<div className="success">{message.text}</div>}
        {message?.type==="error"&&<div className="error">{message.text}</div>}
      </section>
    </div>
  </div>;
}

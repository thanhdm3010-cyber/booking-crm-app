"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { brandLogo } from "@/lib/brandAssets";

type Slot={start:string;end:string;label:string};
const lunchQrUrl="https://img.vietqr.io/image/970407-19074528114010-compact2.png?amount=89000&addInfo=moi%20Thanh%20bua%20trua&accountName=DO%20MANH%20THANH";

function SurveyQuestion({n,children}:{n:number;children:ReactNode}){
  return <div className="question"><div className="qnumber">{n}</div><div className="qbody">{children}</div></div>;
}

function nextDays(count=7){
  const days=[]; const base=new Date();
  for(let i=1;i<=count;i++){const d=new Date(base);d.setDate(base.getDate()+i);days.push(d)}
  return days;
}

export default function BookingClient({slug,hostName}:{slug:string;hostName:string}){
  const days=useMemo(()=>nextDays(7),[]);
  const [step,setStep]=useState<"survey"|"booking">("survey");
  const [surveyPage,setSurveyPage]=useState(1);
  const [survey,setSurvey]=useState<any>(null);
  const [surveyDraft,setSurveyDraft]=useState<any>({});
  const [date,setDate]=useState(days[0].toISOString().slice(0,10));
  const [slots,setSlots]=useState<Slot[]>([]);
  const [slotsLoading,setSlotsLoading]=useState(false);
  const [slotsError,setSlotsError]=useState("");
  const [selected,setSelected]=useState<Slot|null>(null);
  const [loading,setLoading]=useState(false);
  const [bookingComplete,setBookingComplete]=useState(false);
  const [message,setMessage]=useState<{type:"ok"|"error";text:string}|null>(null);

  async function loadSlots(d:string){
    setSelected(null);
    setSlotsLoading(true);
    setSlotsError("");
    try{
      const controller=new AbortController();
      const timer=setTimeout(()=>controller.abort(),6000);
      const res=await fetch("/api/slots?date="+d+"&slug="+slug,{signal:controller.signal,cache:"no-store"});
      clearTimeout(timer);
      if(!res.ok) throw new Error("Không tải được lịch");
      const data=await res.json();
      setSlots(data.slots||[]);
    }catch(error){
      console.error("loadSlots failed",error);
      setSlots([]);
      setSlotsError("Không tải được lịch. Anh/chị vui lòng thử lại.");
    }finally{
      setSlotsLoading(false);
    }
  }
  useEffect(()=>{if(step==="booking") loadSlots(date)},[date,step]);

  const setText=(name:string,value:string)=>setSurveyDraft((d:any)=>({...d,[name]:value}));
  const toggle=(name:string,value:string,checked:boolean)=>setSurveyDraft((d:any)=>{
    const current=new Set<string>(Array.isArray(d[name])?d[name]:[]);
    if(checked) current.add(value); else current.delete(value);
    return {...d,[name]:Array.from(current)};
  });
  const values=(name:string):string[]=>Array.isArray(surveyDraft[name])?surveyDraft[name]:[];
  const textValue=(name:string)=>String(surveyDraft[name]??"");

  function completeSurvey(){
    const data=surveyDraft;
    if(!data.name || !data.email || !data.field){
      setSurveyPage(1);
      setMessage({type:"error",text:"Vui lòng hoàn thành Họ tên, Email và Lĩnh vực trước khi tiếp tục."});
      scrollSurveyTop();
      return;
    }
    if(!/^\S+@\S+\.\S+$/.test(data.email)){
      setSurveyPage(1);
      setMessage({type:"error",text:"Email chưa đúng định dạng. Anh/chị vui lòng kiểm tra lại."});
      scrollSurveyTop();
      return;
    }
    if(!Array.isArray(data.goals) || data.goals.length===0){
      setSurveyPage(2);
      setMessage({type:"error",text:"Vui lòng chọn ít nhất 1 mục tiêu xây kênh ở câu 6."});
      scrollSurveyTop();
      return;
    }
    setSurvey(data);
    setMessage(null);
    setStep("booking");
    window.requestAnimationFrame(()=>window.scrollTo({top:0,behavior:"smooth"}));
  }

  async function book(){
    if(!selected||!survey) return;
    setLoading(true); setMessage(null);
    const payload={
      hostSlug:slug, customerName:survey.name, customerEmail:survey.email, customerPhone:survey.phone,
      note:"", surveyData:survey,
      source:new URLSearchParams(window.location.search).get("utm_source")||"direct",
      campaign:new URLSearchParams(window.location.search).get("utm_campaign")||undefined,
      start:selected.start,end:selected.end
    };
    const res=await fetch("/api/bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});
    const data=await res.json(); setLoading(false);
    if(!res.ok){
      setMessage({type:"error",text:data.error||"Không thể đặt lịch."});
      await loadSlots(date); return;
    }
    setMessage({type:"ok",text:"Đặt lịch thành công. Thành đã nhận được thông tin của anh/chị."});
    setBookingComplete(true);
  }

  const CheckboxGroup=({name,options}:{name:string;options:string[]})=>
    <div className="checkgrid">{options.map(o=><label className="check" key={o}><input type="checkbox" name={name} value={o} checked={values(name).includes(o)} onChange={e=>toggle(name,o,e.target.checked)}/><span>{o}</span></label>)}</div>;

  const scrollSurveyTop=()=>{window.requestAnimationFrame(()=>window.scrollTo({top:0,behavior:"smooth"}))};
  const next=()=>{
    if(surveyPage===1){
      if(!surveyDraft.name || !surveyDraft.email || !surveyDraft.field){
        setMessage({type:"error",text:"Vui lòng hoàn thành Họ tên, Email và Lĩnh vực trước khi tiếp tục."});
        scrollSurveyTop(); return;
      }
      if(!/^\S+@\S+\.\S+$/.test(String(surveyDraft.email))){
        setMessage({type:"error",text:"Email chưa đúng định dạng. Anh/chị vui lòng kiểm tra lại."});
        scrollSurveyTop(); return;
      }
    }
    if(surveyPage===2 && (!Array.isArray(surveyDraft.goals) || surveyDraft.goals.length===0)){
      setMessage({type:"error",text:"Vui lòng chọn ít nhất 1 mục tiêu xây kênh ở câu 6."});
      scrollSurveyTop(); return;
    }
    setMessage(null);
    setSurveyPage(p=>Math.min(5,p+1));
    scrollSurveyTop();
  };
  const back=()=>{setMessage(null);setSurveyPage(p=>Math.max(1,p-1));scrollSurveyTop()};
  const rangeText=surveyPage<5 ? "Câu "+(((surveyPage-1)*5)+1)+"–"+(surveyPage*5) : "Câu 21–24";

  if(bookingComplete) return <section className="card thankyou-card thankyou-visual">
    <div className="thankyou-brand">
      <img src={brandLogo} alt="ANLIFE - Kiến tạo giá trị sống" />
    </div>

    <div className="thankyou-layout">
      <div className="thankyou-message">
        <div className="lunch-badge">Một lời động viên nhỏ 💚</div>
        <h2>Mời Thành một bữa trưa nhé!</h2>
        <h3>Cảm ơn anh/chị đã đặt lịch thành công.</h3>
        <p>
          Thành đã nhận được thông tin của anh/chị. Trước buổi coaching, anh/chị vui lòng chuẩn bị trước
          những thông tin quan trọng, vấn đề đang gặp phải và các câu hỏi muốn trao đổi, để buổi coaching
          đi đúng trọng tâm, tiết kiệm thời gian và mang lại giá trị thực tế nhất.
        </p>
        <p>
          Nếu anh/chị thấy những chia sẻ và buổi coaching cùng Thành hữu ích, anh/chị có thể gửi Thành
          một lời động viên nhỏ qua mã QR bên cạnh.
        </p>

        <div className="amount">89.000đ</div>
        <p className="tiny-note">Anh/chị có thể bỏ qua phần này và vẫn tham gia buổi coaching như bình thường.</p>
      </div>

      <div className="thankyou-payment">
        <div className="payment-heading">Quét mã để chuyển tiền đến</div>
        <strong>ĐỖ MẠNH THÀNH</strong>
        <div className="account-number">1907 4528 1140 10</div>
        <img className="vietqr-image" src={lunchQrUrl} alt="VietQR Techcombank - Đỗ Mạnh Thành - 89.000 đồng" />
      </div>
    </div>
  </section>;

  if(step==="survey") return <section className="card survey-card">
    <div className="survey-welcome">
      <div className="eyebrow">Khảo sát trước khi đặt lịch</div>
      <h2>Chào mừng anh/chị đến với buổi tư vấn cùng Đỗ Mạnh Thành</h2>
      <p className="muted">Một vài câu hỏi ngắn giúp Thành hiểu rõ mục tiêu và tình huống hiện tại để buổi trao đổi đi thẳng vào vấn đề, tiết kiệm thời gian và đưa ra gợi ý sát hơn.</p>
    </div>

    <div className="survey-progress">
      <div className="progress-top"><strong>Trang {surveyPage}/5</strong><span>{rangeText}</span></div>
      <div className="progress-track"><div className="progress-fill" style={{width:String(surveyPage*20)+"%"}}/></div>
    </div>

    <div>
      <div hidden={surveyPage!==1}>
        <SurveyQuestion n={1}><label>Họ và tên *</label><input name="name" placeholder="Nguyễn Văn A" value={textValue("name")} onChange={e=>setText("name",e.target.value)}/></SurveyQuestion>
        <SurveyQuestion n={2}><label>Email *</label><input name="email" type="email" placeholder="ban@email.com" value={textValue("email")} onChange={e=>setText("email",e.target.value)}/></SurveyQuestion>
        <SurveyQuestion n={3}><label>Số điện thoại</label><input name="phone" placeholder="09..." value={textValue("phone")} onChange={e=>setText("phone",e.target.value)}/></SurveyQuestion>
        <SurveyQuestion n={4}><label>Lĩnh vực anh/chị đang hoạt động *</label>
          <select name="field" value={textValue("field")} onChange={e=>setText("field",e.target.value)}><option value="" disabled>Chọn lĩnh vực</option>{["Kinh doanh/Bán hàng","Marketing/Truyền thông","Giáo dục/Đào tạo","Sức khỏe/Wellness","Làm đẹp","Bất động sản","Tài chính/Bảo hiểm","Công nghệ/IT","Nội thất/Xây dựng","Ô tô","F&B","Dịch vụ chuyên môn","Nghệ thuật/Sáng tạo","Khác"].map(x=><option key={x}>{x}</option>)}</select>
        </SurveyQuestion>
        <SurveyQuestion n={5}><label>Sản phẩm/dịch vụ anh/chị đang cung cấp</label><input name="productName" placeholder="Nếu chưa có, có thể để trống" value={textValue("productName")} onChange={e=>setText("productName",e.target.value)}/></SurveyQuestion>
      </div>

      <div hidden={surveyPage!==2}>
        <SurveyQuestion n={6}><label>Anh/chị muốn xây kênh để đạt mục tiêu gì? *</label><CheckboxGroup name="goals" options={["Xây thương hiệu cá nhân","Tìm kiếm khách hàng","Bán sản phẩm/dịch vụ","Tăng uy tín chuyên gia","Chia sẻ kiến thức","Xây cộng đồng","Phát triển sự nghiệp","Tạo thêm nguồn thu"]}/></SurveyQuestion>
        <SurveyQuestion n={7}><label>Anh/chị muốn được mọi người nhớ đến là người như thế nào?</label><CheckboxGroup name="rememberedAs" options={["Chuyên gia","Đáng tin cậy","Tận tâm","Thực tế","Truyền cảm hứng","Sáng tạo","Có chiều sâu","Kỷ luật","Tử tế","Khác"]}/></SurveyQuestion>
        <SurveyQuestion n={8}><label>Anh/chị có thể giúp người khác tốt hơn ở điều gì?</label><CheckboxGroup name="strengths" options={["Kiến thức chuyên môn","Kinh nghiệm thực tế","Giải quyết vấn đề","Hướng dẫn từng bước","Truyền động lực","Tư duy/định hướng","Kỹ năng nghề nghiệp","Kết nối nguồn lực","Khác"]}/></SurveyQuestion>
        <SurveyQuestion n={9}><label>Độ tuổi nhóm người anh/chị muốn phục vụ</label><CheckboxGroup name="customerAges" options={["Dưới 18","18–24","25–34","35–44","45–54","55+"]}/></SurveyQuestion>
        <SurveyQuestion n={10}><label>Nghề nghiệp của nhóm người anh/chị muốn phục vụ</label><CheckboxGroup name="customerJobs" options={["Học sinh/Sinh viên","Nhân viên văn phòng","Chuyên gia","Freelancer","Chủ kinh doanh","Chủ doanh nghiệp","Quản lý/Lãnh đạo","Nội trợ","Khác"]}/></SurveyQuestion>
      </div>

      <div hidden={surveyPage!==3}>
        <SurveyQuestion n={11}><label>Giới tính của nhóm người anh/chị muốn phục vụ</label><select name="customerGender" value={textValue("customerGender")||"Cả nam và nữ"} onChange={e=>setText("customerGender",e.target.value)}><option>Cả nam và nữ</option><option>Nam</option><option>Nữ</option><option>Không xác định cụ thể</option></select></SurveyQuestion>
        <SurveyQuestion n={12}><label>Khu vực sinh sống của nhóm người anh/chị muốn phục vụ</label><CheckboxGroup name="customerAreas" options={["Hà Nội","TP.HCM","Các tỉnh/thành khác","Toàn quốc","Việt Nam ở nước ngoài","Quốc tế"]}/></SurveyQuestion>
        <SurveyQuestion n={13}><label>Nhóm người anh/chị muốn phục vụ đang gặp vấn đề lớn nhất nào?</label><CheckboxGroup name="customerProblems" options={["Thiếu kiến thức","Thiếu kỹ năng","Thiếu thời gian","Thiếu nguồn lực","Thiếu khách hàng","Không biết bắt đầu từ đâu","Không duy trì được","Thiếu tự tin","Chưa tìm được giải pháp phù hợp","Khác"]}/></SurveyQuestion>
        <SurveyQuestion n={14}><label>Sản phẩm/dịch vụ của anh/chị giải quyết nhóm vấn đề nào?</label><CheckboxGroup name="solutionProblems" options={["Tăng doanh thu","Tiết kiệm thời gian","Giảm chi phí","Cải thiện sức khỏe","Phát triển kỹ năng","Phát triển sự nghiệp","Nâng cao hiệu suất","Giải quyết vấn đề chuyên môn","Khác"]}/></SurveyQuestion>
        <SurveyQuestion n={15}><label>Kết quả anh/chị muốn giúp họ đạt được là gì?</label><CheckboxGroup name="customerResults" options={["Có kiến thức rõ ràng hơn","Có quy trình cụ thể","Tiết kiệm thời gian","Tăng doanh thu","Có thêm khách hàng","Tăng năng suất","Tăng sự tự tin","Có kết quả đo lường được","Khác"]}/></SurveyQuestion>
      </div>

      <div hidden={surveyPage!==4}>
        <SurveyQuestion n={16}><label>Điểm khác biệt của anh/chị là gì?</label><CheckboxGroup name="differentiation" options={["Nhiều năm kinh nghiệm","Có kết quả thực tế","Có phương pháp riêng","Có câu chuyện cá nhân","Chuyên môn sâu","Dịch vụ tận tâm","Hiểu khách hàng","Có cộng đồng","Có hệ thống/quy trình","Phong cách cá nhân khác biệt","Khác"]}/></SurveyQuestion>
        <SurveyQuestion n={17}><label>Trải nghiệm nào có thể trở thành chất liệu xây kênh?</label><CheckboxGroup name="experiences" options={["Từng thất bại","Từng mất phương hướng","Từng thay đổi nghề nghiệp","Từng vượt qua khó khăn","Từng khởi nghiệp","Từng xây lại từ đầu","Từng đạt thành tựu nổi bật","Có nhiều case khách hàng","Chưa xác định được"]}/></SurveyQuestion>
        <SurveyQuestion n={18}><label>Anh/chị muốn xây dựng nhóm nội dung nào?</label><CheckboxGroup name="contentPillars" options={["Chuyên môn","Case study","Câu chuyện cá nhân","Tư duy/phát triển bản thân","Hướng dẫn thực hành","Giải đáp câu hỏi","Phân tích xu hướng","Review công cụ/sản phẩm","Quan điểm cá nhân","Lifestyle gắn chuyên môn"]}/></SurveyQuestion>
        <SurveyQuestion n={19}><label>Thời gian có thể dành mỗi ngày</label><select name="dailyTime" value={textValue("dailyTime")||"Dưới 30 phút"} onChange={e=>setText("dailyTime",e.target.value)}>{["Dưới 30 phút","30–60 phút","1–2 giờ","2–3 giờ","Trên 3 giờ"].map(x=><option key={x}>{x}</option>)}</select></SurveyQuestion>
        <SurveyQuestion n={20}><label>Số video có thể thực hiện mỗi tuần</label><select name="videosPerWeek" value={textValue("videosPerWeek")||"1"} onChange={e=>setText("videosPerWeek",e.target.value)}>{["1","2–3","4–5","6–7","Trên 7"].map(x=><option key={x}>{x}</option>)}</select></SurveyQuestion>
      </div>

      <div hidden={surveyPage!==5}>
        <SurveyQuestion n={21}><label>Số bài viết có thể thực hiện mỗi tuần</label><select name="postsPerWeek" value={textValue("postsPerWeek")||"1"} onChange={e=>setText("postsPerWeek",e.target.value)}>{["1","2–3","4–5","6–7","8–14","Trên 14"].map(x=><option key={x}>{x}</option>)}</select></SurveyQuestion>
        <SurveyQuestion n={22}><label>Thời gian anh/chị sẵn sàng cam kết duy trì</label><select name="commitment" value={textValue("commitment")||"21 ngày"} onChange={e=>setText("commitment",e.target.value)}>{["21 ngày","3 tháng","6 tháng","12 tháng","Trên 12 tháng"].map(x=><option key={x}>{x}</option>)}</select></SurveyQuestion>
        <SurveyQuestion n={23}><label>Điều gì có thể khiến anh/chị bỏ cuộc?</label><CheckboxGroup name="quittingRisks" options={["Ít view","Không có khách hàng","Không biết làm nội dung gì","Thiếu thời gian","Ngại xuất hiện","Sợ bị đánh giá","Không thấy kết quả nhanh","Thiếu kỷ luật","Không biết quay/edit","AI không đúng chất mình"]}/></SurveyQuestion>
        <SurveyQuestion n={24}><label>Sau 12 tháng, anh/chị mong muốn kênh mang lại kết quả gì?</label><CheckboxGroup name="yearResults" options={["10.000+ follower","50.000+ follower","100.000+ follower","Có khách hàng đều mỗi tháng","Có thương hiệu cá nhân rõ ràng","Có sản phẩm riêng","Có cộng đồng riêng","Có doanh thu từ kênh","Có đội nhóm","Trở thành chuyên gia được biết đến"]}/></SurveyQuestion>
      </div>

      {message?.type==="error"&&<div className="error">{message.text}</div>}

      <div className="survey-nav">
        <button type="button" className="secondary" onClick={back} disabled={surveyPage===1}>← Quay lại</button>
        {surveyPage<5
          ? <button type="button" className="primary nav-primary" onClick={next}>Tiếp tục →</button>
          : <button type="button" className="primary nav-primary" onClick={completeSurvey}>Hoàn thành → Chọn lịch</button>}
      </div>
    </div>
  </section>;

  return <div>
    <div className="survey-summary card">
      <div><div className="eyebrow">Khảo sát đã hoàn thành · Chọn lịch</div><strong>{survey?.name}</strong> · {survey?.field}</div>
      <button onClick={()=>{setSurveyDraft(survey||surveyDraft);setStep("survey");setSurveyPage(1)}}>Sửa khảo sát</button>
    </div>
    <div className="grid">
      <section className="card">
        <div className="eyebrow">Chọn thời gian</div><h2>{hostName}</h2>
        <p className="muted">Tư vấn 1:1 · 45 phút · Múi giờ Việt Nam</p>
        <div className="days">{days.map(d=>{const value=d.toISOString().slice(0,10);return <button key={value} className={"day "+(date===value?"active":"")} onClick={()=>setDate(value)}><div>{d.toLocaleDateString("vi-VN",{weekday:"short"})}</div><strong>{d.getDate()}</strong></button>})}</div>
        <div className="slots">
          {slotsLoading && <p className="muted">Đang tải lịch trống...</p>}
          {!slotsLoading && slotsError && <div><p className="error">{slotsError}</p><button type="button" className="secondary" onClick={()=>loadSlots(date)}>Thử tải lại</button></div>}
          {!slotsLoading && !slotsError && slots.length===0&&<p className="muted">Ngày này không còn khung giờ trống.</p>}
          {!slotsLoading && !slotsError && slots.map(s=><button key={s.start} className={"slot "+(selected?.start===s.start?"active":"")} onClick={()=>setSelected(s)}>{s.label}</button>)}
        </div>
      </section>
      <section className="card">
        <div className="eyebrow">Xác nhận</div><h2>Hoàn tất đặt lịch</h2>
        <p className="muted">{selected?"Bạn đang chọn "+selected.label+".":"Hãy chọn một khung giờ ở bên trái."}</p>
        <p><strong>{survey?.name}</strong><br/>{survey?.email}<br/>{survey?.phone}</p>
        <button className="primary" disabled={!selected||loading} onClick={book}>{loading?"Đang đặt lịch...":"XÁC NHẬN ĐẶT LỊCH"}</button>
        {message?.type==="ok"&&<div className="success">{message.text}</div>}
        {message?.type==="error"&&<div className="error">{message.text}</div>}
      </section>
    </div>
  </div>;
}

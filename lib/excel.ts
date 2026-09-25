import ExcelJS from "exceljs";
import { config } from "./config";

const surveyLabels: Record<string,string> = {
  name:"Họ và tên",
  email:"Email",
  phone:"Số điện thoại",
  field:"Lĩnh vực đang hoạt động",
  productName:"Sản phẩm / dịch vụ",
  goals:"Mục tiêu xây kênh",
  rememberedAs:"Muốn được khách hàng nhớ đến bởi điều gì",
  strengths:"Thế mạnh",
  customerAges:"Độ tuổi khách hàng mục tiêu",
  customerJobs:"Nghề nghiệp khách hàng mục tiêu",
  customerGender:"Giới tính khách hàng mục tiêu",
  customerAreas:"Khu vực khách hàng mục tiêu",
  customerProblems:"Vấn đề khách hàng đang gặp",
  solutionProblems:"Vấn đề sản phẩm / dịch vụ giải quyết",
  customerResults:"Kết quả khách hàng mong muốn",
  differentiation:"Điểm khác biệt",
  experiences:"Trải nghiệm / câu chuyện có thể chia sẻ",
  contentPillars:"Nhóm nội dung chính",
  dailyTime:"Thời gian có thể dành mỗi ngày",
  videosPerWeek:"Số video mỗi tuần",
  postsPerWeek:"Số bài viết mỗi tuần",
  commitment:"Thời gian cam kết duy trì",
  quittingRisks:"Khó khăn có thể khiến bỏ cuộc",
  yearResults:"Kết quả mong muốn sau 12 tháng"
};

function displayValue(value: unknown): string {
  if (value == null) return "";
  if (Array.isArray(value)) return value.map(displayValue).filter(Boolean).join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function viDate(iso:string){
  return new Date(iso).toLocaleString("vi-VN",{
    timeZone:config.timezone,
    dateStyle:"full",
    timeStyle:"short"
  });
}

export async function createBookingWorkbook(input:{
  customerName:string;
  customerEmail:string;
  customerPhone?:string;
  start:string;
  end:string;
  status?:string;
  source?:string;
  campaign?:string;
  meetUrl?:string|null;
  note?:string;
  surveyData?:Record<string,unknown>;
}){
  const workbook=new ExcelJS.Workbook();
  workbook.creator="Booking CRM";
  workbook.created=new Date();

  const info=workbook.addWorksheet("Thông tin booking");
  info.columns=[
    {header:"Thông tin",key:"label",width:28},
    {header:"Chi tiết",key:"value",width:65}
  ];
  const infoRows=[
    ["Họ và tên",input.customerName],
    ["Email",input.customerEmail],
    ["Số điện thoại",input.customerPhone || ""],
    ["Thời gian bắt đầu",viDate(input.start)],
    ["Thời gian kết thúc",viDate(input.end)],
    ["Trạng thái",input.status || "confirmed"],
    ["Nguồn",input.source || ""],
    ["Chiến dịch",input.campaign || ""],
    ["Link Zoom",input.meetUrl || config.zoomUrl],
    ["Meeting ID",config.zoomMeetingId],
    ["Passcode",config.zoomPasscode],
    ["Ghi chú",input.note || ""]
  ];
  infoRows.forEach(([label,value])=>info.addRow({label,value}));
  info.getRow(1).font={bold:true};
  info.views=[{state:"frozen",ySplit:1}];
  info.getColumn(2).alignment={wrapText:true,vertical:"top"};

  const survey=workbook.addWorksheet("Khảo sát khách hàng");
  survey.columns=[
    {header:"STT",key:"index",width:8},
    {header:"Câu hỏi",key:"question",width:48},
    {header:"Câu trả lời",key:"answer",width:75}
  ];

  const data=input.surveyData || {};
  const orderedKeys=Object.keys(surveyLabels);
  let index=1;
  for(const key of orderedKeys){
    if(Object.prototype.hasOwnProperty.call(data,key)){
      survey.addRow({
        index:index++,
        question:surveyLabels[key] || key,
        answer:displayValue(data[key])
      });
    }
  }
  for(const [key,value] of Object.entries(data)){
    if(!surveyLabels[key]){
      survey.addRow({index:index++,question:key,answer:displayValue(value)});
    }
  }

  survey.getRow(1).font={bold:true};
  survey.views=[{state:"frozen",ySplit:1}];
  survey.getColumn(3).alignment={wrapText:true,vertical:"top"};
  survey.eachRow((row,rowNumber)=>{
    if(rowNumber>1) row.alignment={vertical:"top",wrapText:true};
  });

  const buffer=await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function bookingWorkbookFilename(name:string,start:string){
  const safe=name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-zA-Z0-9]+/g,"-")
    .replace(/^-+|-+$/g,"")
    .slice(0,50) || "Khach-hang";
  const date=new Date(start).toISOString().slice(0,10);
  return `Booking_${safe}_${date}.xlsx`;
}

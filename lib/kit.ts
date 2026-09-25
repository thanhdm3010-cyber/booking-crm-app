const KIT_BASE = "https://api.kit.com/v4";

function kitHeaders(apiKey:string){
  return {
    "Content-Type":"application/json",
    "Accept":"application/json",
    "X-Kit-Api-Key":apiKey
  };
}

async function kitJson(url:string, init:RequestInit, apiKey:string){
  const res=await fetch(url,{...init,headers:{...kitHeaders(apiKey),...(init.headers||{})}});
  if(!res.ok){
    const text=await res.text().catch(()=> "");
    throw new Error(`Kit API ${res.status}: ${text.slice(0,300)}`);
  }
  if(res.status===204) return null;
  return res.json().catch(()=>null);
}

export async function syncBookingSubscriber(input:{
  email:string;
  name?:string;
  tagName?:string;
}){
  const apiKey=process.env.KIT_API_KEY;
  if(!apiKey) return {skipped:true,reason:"KIT_API_KEY missing"};

  const firstName=(input.name||"").trim().split(/\s+/).slice(-1)[0] || undefined;

  await kitJson(`${KIT_BASE}/subscribers`,{
    method:"POST",
    body:JSON.stringify({
      email_address:input.email,
      ...(firstName?{first_name:firstName}:{})
    })
  },apiKey);

  const tag=await kitJson(`${KIT_BASE}/tags`,{
    method:"POST",
    body:JSON.stringify({name:input.tagName||"booking-coaching"})
  },apiKey);

  const tagId=tag?.tag?.id;
  if(!tagId) throw new Error("Kit tag id missing");

  await kitJson(`${KIT_BASE}/tags/${tagId}/subscribers`,{
    method:"POST",
    body:JSON.stringify({email_address:input.email})
  },apiKey);

  return {skipped:false,tagId};
}

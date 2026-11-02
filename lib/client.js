export async function api(path,method='GET',body){
 const res=await fetch(path,{method,cache:'no-store',...(body?{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
 const data=await res.json().catch(()=>({message:'Server javobini o‘qib bo‘lmadi'}));
 if(!res.ok)throw new Error(data.message||'So‘rov bajarilmadi');return data;
}

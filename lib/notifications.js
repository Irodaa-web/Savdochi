import {after} from 'next/server';
import {Notification,User,Reservation} from '@/lib/models';
export async function notify(user,key,text,href='/notifications'){
 try{await Notification.init();
 await Notification.updateOne({user,key},{$setOnInsert:{user,key,text,href}},{upsert:true});
 if(process.env.TELEGRAM_BOT_TOKEN)after(()=>flushTelegram(user));}catch(e){console.error('notification-delivery:',e.code||e.name);}
}
export async function remindHolds(user){const soon=await Reservation.find({buyer:user,expiresAt:{$gt:new Date(),$lt:new Date(Date.now()+6*3600000)}}).limit(50).lean();for(const r of soon)await notify(user,'hold:'+r._id,'Savatdagi mahsulot bandi 6 soat ichida tugaydi.','/cart');}
export async function flushTelegram(user){const u=await User.findById(user).select('telegramChatId isDemo');if(u?.isDemo||!u?.telegramChatId||!process.env.TELEGRAM_BOT_TOKEN)return;for(let i=0;i<10;i++){
 const n=await Notification.findOneAndUpdate({user,telegramSent:false,$or:[{telegramClaimUntil:{$exists:false}},{telegramClaimUntil:{$lt:new Date()}}]},{$set:{telegramClaimUntil:new Date(Date.now()+60000)}},{new:true});if(!n)return;
 try{const res=await fetch('https://api.telegram.org/bot'+process.env.TELEGRAM_BOT_TOKEN+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:u.telegramChatId,text:n.text+'\n'+(process.env.APP_ORIGIN||'https://savdochi-b2b.vercel.app')+n.href}),signal:AbortSignal.timeout(8000)});const body=await res.json();if(!res.ok||!body.ok)throw new Error('Delivery failed');await Notification.updateOne({_id:n._id},{$set:{telegramSent:true}});}catch{return;}
}}

import {NextResponse} from 'next/server';
import {Message,Chat,Order} from '@/lib/models';
import {requireUser,checkOrigin,fail,idCheck} from '@/lib/api';
import {notify} from '@/lib/notifications';
import {AppError} from '@/lib/commerce.mjs';
import {messageInput} from '@/lib/commerce.mjs';
import {ownedChat,messageJSON} from '@/lib/chat';
export const dynamic='force-dynamic';
export async function GET(req,{params}){try{
 const user=await requireUser();const {id}=await params;await ownedChat(id,user);
 const before=new URL(req.url).searchParams.get('before');if(before)idCheck(before);
 const rows=await Message.find({chat:id,...(before?{_id:{$lt:before}}:{})}).sort({_id:-1}).limit(51).lean();
 const hasMore=rows.length>50;const page=rows.slice(0,50).reverse();
 return NextResponse.json({messages:page.map(messageJSON),hasMore,nextBefore:hasMore?String(page[0]._id):null});
}catch(e){return fail(e);}}
export async function POST(req,{params}){try{
 checkOrigin(req);const user=await requireUser();const {id}=await params;const chat=await ownedChat(id,user);const b=await req.json(),data=messageInput(b);if(b.orderId){idCheck(b.orderId);if(!await Order.exists({_id:b.orderId,buyer:chat.buyer,seller:chat.seller}))throw new AppError('Buyurtma bu suhbatga tegishli emas',403);data.order=b.orderId;}
 await Message.init();let message;
 try{message=await Message.findOneAndUpdate({chat:id,sender:user._id,clientId:data.clientId},{$setOnInsert:{chat:id,sender:user._id,...data}},{upsert:true,new:true,runValidators:true});}catch(e){if(e.code!==11000)throw e;message=await Message.findOne({chat:id,sender:user._id,clientId:data.clientId});}
 await Chat.updateOne({_id:id,$or:[{lastMessageAt:{$exists:false}},{lastMessageAt:{$lte:message.createdAt}}]},{$set:{lastMessage:message.text.slice(0,140),lastMessageAt:message.createdAt}});
 await notify(user.role==='seller'?chat.buyer:chat.seller,'message:'+message._id,user.name+' yangi xabar yubordi.','/chat?id='+id);
 return NextResponse.json({message:messageJSON(message)},{status:201});
}catch(e){return fail(e);}}

export async function PATCH(req,{params}){try{checkOrigin(req);const u=await requireUser();const {id}=await params;await ownedChat(id,u);const {lastId}=await req.json();idCheck(lastId);const m=await Message.findOne({_id:lastId,chat:id}).select('createdAt');if(m)await Chat.updateOne({_id:id},{$max:{[u.role+'ReadAt']:m.createdAt}});return NextResponse.json({ok:true});}catch(e){return fail(e);}}

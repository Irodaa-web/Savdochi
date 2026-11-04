import {NextResponse} from 'next/server';
import {Chat,Order,User,Message,Partnership} from '@/lib/models';
import {requireUser,checkOrigin,fail,idCheck} from '@/lib/api';
import {AppError} from '@/lib/commerce.mjs';
import {participantFilter} from '@/lib/chat';
export const dynamic='force-dynamic';
export async function GET(){try{
 const user=await requireUser();const other=user.role==='seller'?'buyer':'seller';
 const chats=await Chat.find(participantFilter(user)).sort({updatedAt:-1}).populate(other,'name role').lean();
 const counts=chats.length?await Message.aggregate([{$match:{$or:chats.map(c=>({chat:c._id,sender:{$ne:user._id},createdAt:{$gt:c[user.role+'ReadAt']||new Date(0)}}))}},{$group:{_id:'$chat',count:{$sum:1}}}]):[];const unread=new Map(counts.map(c=>[String(c._id),c.count]));
 return NextResponse.json({chats:chats.filter(c=>c[other]).map(c=>({unread:unread.get(String(c._id))||0,id:String(c._id),partnerId:String(c[other]._id),name:c[other].name,role:c[other].role,lastMessage:c.lastMessage,lastMessageAt:c.lastMessageAt||c.createdAt}))});
}catch(e){return fail(e);}}
export async function POST(req){try{
 checkOrigin(req);const user=await requireUser();const {partnerId}=await req.json();idCheck(partnerId);
 const partner=await User.findById(partnerId).select('name role');
 if(!partner||partner.role===user.role)throw new AppError('Mos biznes hamkor topilmadi',404);
 const pair=user.role==='buyer'?{buyer:user._id,seller:partner._id}:{seller:user._id,buyer:partner._id};
 if(user.role==='seller'&&!await Chat.exists(pair)&&!await Order.exists(pair)&&!await Partnership.exists({...pair,status:'accepted'}))throw new AppError('Faqat o‘z hamkoringiz bilan suhbat boshlashingiz mumkin',403);
 await Chat.init();let chat;
 try{chat=await Chat.findOneAndUpdate(pair,{$setOnInsert:pair},{upsert:true,new:true});}catch(e){if(e.code!==11000)throw e;chat=await Chat.findOne(pair);}
 return NextResponse.json({chat:{id:String(chat._id),partnerId:String(partner._id),name:partner.name,role:partner.role}});
}catch(e){return fail(e);}}

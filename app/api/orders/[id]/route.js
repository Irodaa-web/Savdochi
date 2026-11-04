import mongoose from 'mongoose';
import {NextResponse} from 'next/server';
import {Order,Product} from '@/lib/models';
import {requireUser,checkOrigin,fail,orderJSON,idCheck} from '@/lib/api';
import {AppError} from '@/lib/commerce.mjs';
import {num,str,deliveryDateInput} from '@/lib/business.mjs';
import {notify} from '@/lib/notifications';
export async function PATCH(req,{params}){let session;try{
 checkOrigin(req);const user=await requireUser();const {id}=await params;idCheck(id);const b=await req.json();session=await mongoose.startSession();let result,changed=false;
 await session.withTransaction(async()=>{changed=false;const o=await Order.findOne({_id:id,...(user.role==='seller'?{seller:user._id}:{buyer:user._id})}).session(session);if(!o)throw new AppError('Buyurtma topilmadi',404);
 if(b.version&&new Date(b.version).getTime()!==o.updatedAt.getTime())throw new AppError('Buyurtma yangilangan. Yangilab qayta urinib ko‘ring.',409);
 const action=b.action||b.status;if(action===o.status){result=o;return;}let note='';
 if(action==='propose'){
  if(o.paymentStatus==='paid')throw new AppError('To‘lov tasdiqlangan buyurtma narxini o‘zgartirib bo‘lmaydi',409);if(user.role!=='seller'||!['pending','confirmed','proposed'].includes(o.status))throw new AppError('Hozir taklif yuborib bo‘lmaydi',409);
  if(!Array.isArray(b.items)||b.items.length!==o.items.length)throw new AppError('Barcha mahsulot miqdorlarini kiriting');const seen=new Set();const items=b.items.map(x=>{const old=o.items.find(i=>String(i.productId)===x.productId);if(!old||seen.has(x.productId))throw new AppError('Mahsulotlar noto‘g‘ri');seen.add(x.productId);return {productId:old.productId,quantity:num(x.quantity,0,old.quantity),price:num(x.price,1)};});if(!items.some(x=>x.quantity>0))throw new AppError('Kamida bitta mahsulot qolsin');
  const reason=str(b.reason||'',1000);if(reason.length<3)throw new AppError('O‘zgartirish sababini yozing');o.proposal={items,reason,deliveryDate:deliveryDateInput(b.deliveryDate),deliveryFee:num(b.deliveryFee??o.deliveryFee??0),createdAt:new Date()};o.status='proposed';note=reason;
 }else if(action==='confirm_refund'){if(user.role!=='buyer'||o.status!=='cancelled'||o.refundStatus!=='pending')throw new AppError('Qaytarish tasdiqlanmaydi',409);o.refundStatus='refunded';
 }else if(['accept_proposal','reject_proposal'].includes(action)){
  if(user.role!=='buyer'||o.status!=='proposed'||!o.proposal)throw new AppError('Faol taklif topilmadi',409);
  if(action==='accept_proposal'){for(const old of o.items){const next=o.proposal.items.find(i=>String(i.productId)===String(old.productId));const delta=old.quantity-next.quantity;if(delta)await Product.updateOne({_id:old.productId},{$inc:{stock:delta}},{session});old.quantity=next.quantity;old.price=next.price;}o.items=o.items.filter(i=>i.quantity>0);o.subtotal=o.items.reduce((n,i)=>n+i.quantity*i.price,0);o.deliveryFee=o.proposal.deliveryFee;o.total=o.subtotal+o.deliveryFee;o.deliveryDate=o.proposal.deliveryDate;o.status='confirmed';}else{o.status='pending';}note=o.proposal.reason;o.proposal=null;
 }else if(action==='report_payment'||action==='confirm_payment'){
  if(o.status==='proposed')throw new AppError('Avval buyurtma taklifini kelishing',409);if(o.status==='cancelled')throw new AppError('Bekor qilingan buyurtma',409);if(action==='report_payment'&&user.role!=='buyer'||action==='confirm_payment'&&user.role!=='seller')throw new AppError('Ruxsat yo‘q',403);const next=action==='report_payment'?'reported':'paid';if(o.paymentStatus==='paid')throw new AppError('To‘lov allaqachon tasdiqlangan',409);o.paymentStatus=next;note=str(b.note||'',500);o.paymentNote=note;
 }else{
  const allowed=user.role==='seller'?{pending:['confirmed','cancelled'],proposed:['cancelled'],confirmed:['shipped','cancelled'],shipped:['delivered']}:{pending:['cancelled'],proposed:['cancelled'],shipped:['received'],delivered:['received']};
  if(!allowed[o.status]?.includes(action))throw new AppError('Bu holatga o‘tkazib bo‘lmaydi',409);
  if(action==='cancelled'){note=str(b.reason||'',1000);if(user.role==='seller'&&note.length<3)throw new AppError('Bekor qilish sababini yozing');for(const i of o.items)await Product.updateOne({_id:i.productId},{$inc:{stock:i.quantity}},{session});o.cancellationReason=note;o.proposal=null;if(o.paymentStatus==='paid'||o.paymentStatus==='reported')o.refundStatus='pending';}
  if(action==='confirmed')o.deliveryDate=deliveryDateInput(b.deliveryDate)||new Date(Date.now()+86400000).toISOString().slice(0,10);
  if(action==='received')o.receivedAt=new Date();o.status=action;
 }
 o.history.push({action,actor:String(user._id),note,at:new Date()});await o.save({session});result=o;changed=true;
 });
 if(changed)await notify(user.role==='seller'?result.buyer:result.seller,'order:'+result._id+':'+result.updatedAt.getTime(),'Buyurtma #'+String(result._id).slice(-8)+' yangilandi.','/orders');
 return NextResponse.json({order:orderJSON(result)});
}catch(e){return fail(e);}finally{await session?.endSession();}}

import mongoose from 'mongoose';
import {NextResponse} from 'next/server';
import {Order,Product} from '@/lib/models';
import {requireUser,checkOrigin,fail,orderJSON,idCheck} from '@/lib/api';
import {AppError,nextStatus} from '@/lib/commerce.mjs';
export async function PATCH(req,{params}){let session;try{
  checkOrigin(req);const user=await requireUser();const {id}=await params;idCheck(id);const {status}=await req.json();
  session=await mongoose.startSession();let result;
  await session.withTransaction(async()=>{
    const order=await Order.findOne({_id:id,...(user.role==='seller'?{seller:user._id}:{buyer:user._id})}).session(session);
    if(!order)throw new AppError('Buyurtma topilmadi',404);
    if(order.status===status){result=order;return;}
    nextStatus(order.status,status,user.role);
    if(status==='cancelled')for(const item of order.items)await Product.updateOne({_id:item.productId},{$inc:{stock:item.quantity}},{session});
    order.status=status;await order.save({session});result=order;
  });
  return NextResponse.json({order:orderJSON(result)});
}catch(e){return fail(e);}finally{await session?.endSession();}}

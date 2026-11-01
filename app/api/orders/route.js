import mongoose from 'mongoose';
import {NextResponse} from 'next/server';
import {Product,Order} from '@/lib/models';
import {requireUser,checkOrigin,fail,orderJSON} from '@/lib/api';
import {AppError,checkoutInput} from '@/lib/commerce.mjs';
export const dynamic='force-dynamic';
export async function GET(){try{
  const user=await requireUser();
  const orders=await Order.find(user.role==='seller'?{seller:user._id}:{buyer:user._id}).sort({createdAt:-1}).lean();
  return NextResponse.json({orders:orders.map(orderJSON)});
}catch(e){return fail(e);}}
export async function POST(req){let session;try{
  checkOrigin(req);const user=await requireUser('buyer');const data=checkoutInput(await req.json());
  // The unique index and transaction make retries safe, including multi-seller baskets.
  await Promise.all([Order.init(),Product.init()]);
  session=await mongoose.startSession();let result;
  await session.withTransaction(async()=>{
    const existing=await Order.find({buyer:user._id,requestId:data.requestId}).session(session);
    if(existing.length){result=existing;return;}
    const groups=new Map();
    for(const item of data.items){
      const p=await Product.findOneAndUpdate({_id:item.productId,active:true,stock:{$gte:item.quantity},minOrder:{$lte:item.quantity}},{$inc:{stock:-item.quantity}},{new:true,session});
      if(!p) throw new AppError('Mahsulot mavjud emas, qoldiq yetmaydi yoki minimal miqdor bajarilmagan. Savatni yangilang.',409);
      const key=String(p.seller);
      if(!groups.has(key))groups.set(key,{buyer:user._id,buyerName:user.name,seller:p.seller,supplier:p.supplier,requestId:data.requestId,phone:data.phone,address:data.address,note:data.note,items:[],total:0});
      const group=groups.get(key);const total=p.price*item.quantity;
      if(!Number.isSafeInteger(total)||!Number.isSafeInteger(group.total+total))throw new AppError('Buyurtma summasi juda katta');
      group.items.push({productId:p._id,name:p.name,unit:p.unit,price:p.price,quantity:item.quantity});group.total+=total;
    }
    result=await Order.create([...groups.values()],{session,ordered:true});
  });
  return NextResponse.json({orders:result.map(orderJSON)},{status:201});
}catch(e){return fail(e);}finally{await session?.endSession();}}

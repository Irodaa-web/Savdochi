import mongoose from 'mongoose';
import {NextResponse} from 'next/server';
import {Product,Order,Reservation,User,Partnership} from '@/lib/models';
import {requireUser,checkOrigin,fail,orderJSON} from '@/lib/api';
import {AppError,checkoutInput} from '@/lib/commerce.mjs';
import {priceFor,deliveryCost,str,paymentMethods} from '@/lib/business.mjs';
import {notify} from '@/lib/notifications';
import {releaseExpired} from '@/lib/reservations';
export const dynamic='force-dynamic';
export async function GET(){try{
  const user=await requireUser();
  const orders=await Order.find(user.role==='seller'?{seller:user._id}:{buyer:user._id}).sort({createdAt:-1}).lean();
  return NextResponse.json({orders:orders.map(orderJSON)});
}catch(e){return fail(e);}}
export async function POST(req){let session;try{
  checkOrigin(req);const user=await requireUser('buyer');const body=await req.json(),data=checkoutInput(body);const region=str(body.region||'',100),paymentMethod=str(body.paymentMethod||'Naqd',60);if(!paymentMethods.includes(paymentMethod))throw new AppError('To‘lov usulini tanlang');
  await releaseExpired();
  // The unique index and transaction make retries safe, including multi-seller baskets.
  await Promise.all([Order.init(),Product.init()]);
  session=await mongoose.startSession();let result;
  await session.withTransaction(async()=>{
    await User.updateOne({_id:user._id},{$inc:{cartVersion:1}},{session});
    const existing=await Order.find({buyer:user._id,requestId:data.requestId}).session(session);
    if(existing.length){result=existing;return;}
    const groups=new Map();
    for(const item of data.items){
      const hold=await Reservation.findOne({buyer:user._id,product:item.productId,quantity:item.quantity,expiresAt:{$gt:new Date()}}).session(session);
      if(!hold)throw new AppError('Savatdagi band qilish muddati tugagan yoki miqdor o‘zgargan. Savatni yangilang.',409);
      const p=await Product.findOne({_id:item.productId,active:true,minOrder:{$lte:item.quantity}}).session(session);
      await Reservation.deleteOne({_id:hold._id},{session});
      if(!p) throw new AppError('Mahsulot mavjud emas, qoldiq yetmaydi yoki minimal miqdor bajarilmagan. Savatni yangilang.',409);
      const key=String(p.seller);const relation=await Partnership.findOne({buyer:user._id,seller:p.seller,status:'accepted'}).session(session);const price=priceFor(p,item.quantity,relation?.discount||0);
      if(!groups.has(key))groups.set(key,{buyer:user._id,buyerName:user.name,seller:p.seller,supplier:p.supplier,requestId:data.requestId,phone:data.phone,address:data.address,note:data.note,location:data.location,region,paymentMethod,items:[],total:0,history:[{action:'pending',actor:String(user._id),at:new Date(),note:'Buyurtma yuborildi'}]});
      const group=groups.get(key);const total=price*item.quantity;
      if(!Number.isSafeInteger(total)||!Number.isSafeInteger(group.total+total))throw new AppError('Buyurtma summasi juda katta');
      group.items.push({productId:p._id,name:p.name,unit:p.unit,price,quantity:item.quantity});group.total+=total;
    }
    for(const g of groups.values()){
      const seller=await User.findById(g.seller).select('name profile blocked').session(session);if(!seller||seller.blocked)throw new AppError('Yetkazib beruvchi faol emas',409);const profile=seller.profile||{};
      if(g.total<(profile.minOrderTotal||0))throw new AppError(seller.name+' uchun minimal buyurtma summasi: '+profile.minOrderTotal,409);
      if(profile.deliveryAreas?.length&&!profile.deliveryAreas.some(a=>a.toLowerCase()===region.toLowerCase()))throw new AppError('Kompaniya tanlangan hududga yetkazib bermaydi',409);
      if(profile.paymentMethods?.length&&!profile.paymentMethods.includes(paymentMethod))throw new AppError('Tanlangan to‘lov usuli kompaniyada mavjud emas',409);
      g.subtotal=g.total;g.deliveryFee=deliveryCost(profile,g.total);g.total+=g.deliveryFee;
    }
    const finalTotal=[...groups.values()].reduce((n,g)=>n+g.total,0);
    if(body.expectedTotal!==undefined&&body.expectedTotal!==finalTotal)throw new AppError('Narx yoki yetkazish shartlari o‘zgargan. Savatni tekshirib qayta yuboring.',409);
    result=await Order.create([...groups.values()],{session,ordered:true});
  });
  for(const o of result)await notify(o.seller,'new-order:'+o._id,user.name+' yangi buyurtma yubordi.','/orders');
  return NextResponse.json({orders:result.map(orderJSON)},{status:201});
}catch(e){return fail(e);}finally{await session?.endSession();}}

import mongoose from 'mongoose';
import {Product,Reservation,User,Partnership} from '@/lib/models';
import {productJSON} from '@/lib/api';
import {priceFor,deliveryCost} from '@/lib/business.mjs';
import {AppError} from '@/lib/commerce.mjs';
export const HOLD_MS=3*24*60*60*1000;
// Expired holds are released transactionally before inventory is read or changed.
// No TTL deletion: deleting a hold without returning stock would lose inventory.
export async function releaseExpired(){
 await Reservation.init();
 while(true){
  const expired=await Reservation.find({expiresAt:{$lte:new Date()}}).select('_id').limit(100).lean();
  if(!expired.length)return;
  const session=await mongoose.startSession();
  try{await session.withTransaction(async()=>{
   const rows=await Reservation.find({_id:{$in:expired.map(r=>r._id)},expiresAt:{$lte:new Date()}}).session(session);
   for(const r of rows){await Product.updateOne({_id:r.product},{$inc:{stock:r.quantity}},{session});await Reservation.deleteOne({_id:r._id},{session});}
  });}finally{await session.endSession();}
 }
}
export async function cartJSON(buyer){
 const rows=await Reservation.find({buyer,expiresAt:{$gt:new Date()}}).sort({createdAt:1}).lean();
 const products=await Product.find({_id:{$in:rows.map(r=>r.product)}}).select('-image').lean();
 const sellerIds=[...new Set(products.map(p=>String(p.seller)))];
 const [sellers,relations]=await Promise.all([User.find({_id:{$in:sellerIds}}).select('name profile').lean(),Partnership.find({buyer,status:'accepted',seller:{$in:sellerIds}}).lean()]);
 const groups=sellers.map(s=>{const discount=relations.find(r=>String(r.seller)===String(s._id))?.discount||0;const lines=rows.filter(r=>products.some(p=>String(p._id)===String(r.product)&&String(p.seller)===String(s._id))).map(r=>{const p=products.find(p=>String(p._id)===String(r.product));return {id:String(r.product),quantity:r.quantity,expiresAt:r.expiresAt,unitPrice:priceFor(p,r.quantity,discount)};});const subtotal=lines.reduce((a,r)=>a+r.quantity*r.unitPrice,0),deliveryFee=deliveryCost(s.profile,subtotal);return {sellerId:String(s._id),name:s.name,discount,subtotal,deliveryFee,total:subtotal+deliveryFee,profile:s.profile,items:lines};});
 return {items:groups.flatMap(g=>g.items),groups};
}
export async function reserveItem(buyer,productId,quantity){
 await releaseExpired();const session=await mongoose.startSession();
 try{await session.withTransaction(async()=>{
  // Serializes this buyer's cart mutations and checkout, including different products.
  await User.updateOne({_id:buyer},{$inc:{cartVersion:1}},{session});
  const hold=await Reservation.findOne({buyer,product:productId}).session(session);
  if(quantity===0){if(hold){await Product.updateOne({_id:productId},{$inc:{stock:hold.quantity}},{session});await Reservation.deleteOne({_id:hold._id},{session});}return;}
  if(!hold&&await Reservation.countDocuments({buyer}).session(session)>=50)throw new AppError('Savatda ko‘pi bilan 50 turdagi mahsulot bo‘lsin');
  const source=await Product.findById(productId).session(session);if(!source)throw new AppError('Mahsulot topilmadi',404);
  const seller=await User.findById(source.seller).select('profile blocked').session(session);if(!seller||seller.blocked)throw new AppError('Yetkazib beruvchi faol emas',409);
  if(seller.profile?.partnerOnlyHolds&&!await Partnership.exists({buyer,seller:source.seller,status:'accepted'}).session(session))throw new AppError('Bu kompaniyada band qilish faqat tasdiqlangan hamkorlarga ochiq',403);
  const owned=await Product.find({seller:source.seller}).select('_id').session(session);const holds=await Reservation.find({buyer,product:{$in:owned.map(p=>p._id)}}).session(session);
  const reserved=holds.reduce((sum,r)=>sum+r.quantity,0)-(hold?.quantity||0)+quantity;
  if(reserved>(seller.profile?.holdLimit||100000))throw new AppError('Bu kompaniyadagi band qilish limiti: '+(seller.profile?.holdLimit||100000)+' birlik',409);
  const delta=quantity-(hold?.quantity||0);
  const product=await Product.findOneAndUpdate({_id:productId,active:true,minOrder:{$lte:quantity},...(delta>0?{stock:{$gte:delta}}:{})},{$inc:{stock:-delta}},{new:true,session});
  if(!product)throw new AppError('Qoldiq yetmaydi yoki minimal miqdor bajarilmagan. Savatni yangilang.',409);
  if(hold){hold.quantity=quantity;await hold.save({session});}
  else await Reservation.create([{buyer,product:productId,quantity,expiresAt:new Date(Date.now()+HOLD_MS)}],{session});
 });}finally{await session.endSession();}
 const [cart,product]=await Promise.all([cartJSON(buyer),Product.findById(productId).select('-image').lean()]);
 return {...cart,product:product?productJSON(product):null};
}

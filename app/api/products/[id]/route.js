import crypto from 'node:crypto';
import {productExtra} from '@/lib/business.mjs';
import {NextResponse} from 'next/server';
import {releaseExpired} from '@/lib/reservations';
import {Product} from '@/lib/models';
import {requireUser,checkOrigin,fail,productJSON,idCheck} from '@/lib/api';
import {AppError,productInput} from '@/lib/commerce.mjs';
export async function PATCH(req,{params}){try{
  checkOrigin(req);const user=await requireUser('seller');const {id}=await params;idCheck(id);
  const body=await req.json();const data={...productInput(body),...productExtra(body)};if(body.image===undefined)delete data.image;else data.imageKey=data.image?crypto.createHash('sha256').update(data.image).digest('hex').slice(0,12):'';await releaseExpired();
  const product=await Product.findOneAndUpdate({_id:id,seller:user._id,active:true,...(body.updatedAt?{updatedAt:new Date(body.updatedAt)}:{})},{$set:data},{new:true,runValidators:true});
  if(!product) throw new AppError('Mahsulot o‘zgargan yoki topilmadi. Qayta ochib tahrirlang.',409);
  return NextResponse.json({product:productJSON(product)});
}catch(e){return fail(e);}}
export async function DELETE(req,{params}){try{
  checkOrigin(req);const user=await requireUser('seller');const {id}=await params;idCheck(id);
  const product=await Product.findOneAndUpdate({_id:id,seller:user._id,active:true},{$set:{active:false}});
  if(!product) throw new AppError('Mahsulot topilmadi',404);
  return NextResponse.json({ok:true});
}catch(e){return fail(e);}}

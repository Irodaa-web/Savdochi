import {NextResponse} from 'next/server';
import {Product} from '@/lib/models';
import {requireUser,checkOrigin,fail,productJSON,idCheck} from '@/lib/api';
import {AppError,productInput} from '@/lib/commerce.mjs';
export async function PATCH(req,{params}){try{
  checkOrigin(req);const user=await requireUser('seller');const {id}=await params;idCheck(id);
  const data=productInput(await req.json());
  const product=await Product.findOneAndUpdate({_id:id,seller:user._id,active:true},{$set:data},{new:true,runValidators:true});
  if(!product) throw new AppError('Mahsulot topilmadi',404);
  return NextResponse.json({product:productJSON(product)});
}catch(e){return fail(e);}}
export async function DELETE(req,{params}){try{
  checkOrigin(req);const user=await requireUser('seller');const {id}=await params;idCheck(id);
  const product=await Product.findOneAndUpdate({_id:id,seller:user._id,active:true},{$set:{active:false}});
  if(!product) throw new AppError('Mahsulot topilmadi',404);
  return NextResponse.json({ok:true});
}catch(e){return fail(e);}}

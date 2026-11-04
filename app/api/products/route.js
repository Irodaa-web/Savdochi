import crypto from 'node:crypto';
import {productExtra} from '@/lib/business.mjs';
import {NextResponse} from 'next/server';
import {connectDB} from '@/lib/mongodb';
import {releaseExpired} from '@/lib/reservations';
import {Product} from '@/lib/models';
import {requireUser,checkOrigin,fail,productJSON} from '@/lib/api';
import {productInput} from '@/lib/commerce.mjs';
export const dynamic='force-dynamic';
export async function GET(req){try{
  const mine=new URL(req.url).searchParams.get('mine')==='1';
  const user=mine?await requireUser('seller'):null;
  await connectDB();await releaseExpired();
  const products=await Product.find({active:true,...(user?{seller:user._id}:{})}).select('-image').sort({createdAt:-1}).lean();
  return NextResponse.json({products:products.map(productJSON)});
}catch(e){return fail(e);}}
export async function POST(req){try{
  checkOrigin(req);const user=await requireUser('seller');const body=await req.json();const data={...productInput(body),...productExtra(body)};
  data.imageKey=data.image?crypto.createHash('sha256').update(data.image).digest('hex').slice(0,12):'';const product=await Product.create({...data,seller:user._id,supplier:user.name});
  return NextResponse.json({product:productJSON(product)},{status:201});
}catch(e){return fail(e);}}

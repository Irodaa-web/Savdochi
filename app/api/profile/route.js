import {NextResponse} from 'next/server';
import {requireUser,checkOrigin,fail} from '@/lib/api';
import {User,Product} from '@/lib/models';
import {profileInput,str} from '@/lib/business.mjs';
import {AppError} from '@/lib/commerce.mjs';
export async function GET(){try{const u=await requireUser();return NextResponse.json({name:u.name,profile:u.profile,verification:u.verification});}catch(e){return fail(e);}}
export async function PUT(req){try{checkOrigin(req);const u=await requireUser();const b=await req.json(),name=str(b.name,120);if(name.length<2)throw new AppError('Biznes nomini kiriting');const profile=profileInput(b.profile||{});if(u.role==='seller'&&!profile.paymentMethods.length)throw new AppError('Kamida bitta to‘lov usulini tanlang');const changed=JSON.stringify(u.profile?.toObject?.()||{})!==JSON.stringify(profile)||name!==u.name;const verification=changed&&u.verification==='verified'?'pending':u.verification;await User.updateOne({_id:u._id},{$set:{name,profile,verification}});if(u.role==='seller')await Product.updateMany({seller:u._id},{$set:{supplier:name}});return NextResponse.json({ok:true,name,profile,verification});}catch(e){return fail(e);}}
export async function POST(req){try{checkOrigin(req);const u=await requireUser();if(!u.profile?.phone||!u.profile?.region||!u.profile?.address)throw new AppError('Tekshiruvdan oldin telefon, hudud va manzilni to‘ldiring');await User.updateOne({_id:u._id},{$set:{verification:'pending'}});return NextResponse.json({ok:true});}catch(e){return fail(e);}}

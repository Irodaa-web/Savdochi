import {NextResponse} from 'next/server';
import {requireUser,checkOrigin,fail,idCheck} from '@/lib/api';
import {Ticket,Order} from '@/lib/models';
import {str} from '@/lib/business.mjs';
import {AppError} from '@/lib/commerce.mjs';
export async function GET(){try{const u=await requireUser();const rows=await Ticket.find({user:u._id}).sort({createdAt:-1}).limit(100).lean();return NextResponse.json({tickets:rows.map(t=>({...t,_id:undefined,id:String(t._id)}))});}catch(e){return fail(e);}}
export async function POST(req){try{checkOrigin(req);const u=await requireUser();const b=await req.json();if(b.orderId){idCheck(b.orderId);if(!await Order.exists({_id:b.orderId,$or:[{buyer:u._id},{seller:u._id}]}))throw new AppError('Buyurtma topilmadi',404);}const subject=str(b.subject,150),text=str(b.text,2000);if(subject.length<3||text.length<5)throw new AppError('Mavzu va murojaatni to‘ldiring');await Ticket.create({user:u._id,order:b.orderId||null,subject,text});return NextResponse.json({ok:true},{status:201});}catch(e){return fail(e);}}

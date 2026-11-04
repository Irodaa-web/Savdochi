import {NextResponse} from 'next/server';
import {requireUser,checkOrigin,fail,idCheck} from '@/lib/api';
import {Order,Reservation} from '@/lib/models';
import {reserveItem} from '@/lib/reservations';
import {AppError} from '@/lib/commerce.mjs';
export async function POST(req,{params}){try{checkOrigin(req);const u=await requireUser('buyer');const {id}=await params;idCheck(id);const order=await Order.findOne({_id:id,buyer:u._id});if(!order)throw new AppError('Buyurtma topilmadi',404);const added=[],skipped=[];for(const i of order.items){try{const held=await Reservation.findOne({buyer:u._id,product:i.productId,expiresAt:{$gt:new Date()}});await reserveItem(u._id,i.productId,Math.max(held?.quantity||0,i.quantity));added.push(i.name);}catch(e){if(!(e instanceof AppError))throw e;skipped.push(i.name+': '+e.message);}}return NextResponse.json({added,skipped});}catch(e){return fail(e);}}

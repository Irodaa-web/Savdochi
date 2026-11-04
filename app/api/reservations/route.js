import {NextResponse} from 'next/server';
import {requireUser,fail} from '@/lib/api';
import {Reservation,Product} from '@/lib/models';
import {releaseExpired} from '@/lib/reservations';
export async function GET(){try{const u=await requireUser('seller');await releaseExpired();const products=await Product.find({seller:u._id}).select('name').lean(),names=new Map(products.map(p=>[String(p._id),p.name]));const rows=await Reservation.find({product:{$in:products.map(p=>p._id)}}).populate({path:'buyer',model:'SavdochiUser',select:'name'}).sort({expiresAt:1}).lean();return NextResponse.json({reservations:rows.map(r=>({id:String(r._id),product:names.get(String(r.product)),buyer:r.buyer?.name||'Do‘kon',quantity:r.quantity,expiresAt:r.expiresAt}))});}catch(e){return fail(e);}}

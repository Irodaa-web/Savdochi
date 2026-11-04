import {marketFilter} from '@/lib/demo-access.mjs';
import {AppError} from '@/lib/commerce.mjs';
import {NextResponse} from 'next/server';
import {requireUser,checkOrigin,fail,idCheck,productJSON} from '@/lib/api';
import {User,Product} from '@/lib/models';
export async function GET(){try{const u=await requireUser('buyer');const rows=await Product.find({_id:{$in:u.favorites||[]},active:true,...marketFilter(u)}).select('-image').lean();return NextResponse.json({products:rows.map(productJSON)});}catch(e){return fail(e);}}
export async function PUT(req){try{checkOrigin(req);const u=await requireUser('buyer');const {id,saved}=await req.json();idCheck(id);if(saved&&!await Product.exists({_id:id,active:true,...marketFilter(u)}))throw new AppError('Mahsulot topilmadi',404);await User.updateOne({_id:u._id},saved?{$addToSet:{favorites:id}}:{$pull:{favorites:id}});return NextResponse.json({ok:true});}catch(e){return fail(e);}}

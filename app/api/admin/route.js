import {NextResponse} from 'next/server';
import {requireAdmin} from '@/lib/admin';
import {checkOrigin,fail,idCheck} from '@/lib/api';
import {User,Ticket,Product} from '@/lib/models';
import {AppError} from '@/lib/commerce.mjs';
import {str} from '@/lib/business.mjs';
import {notify} from '@/lib/notifications';
export async function GET(){try{await requireAdmin();const [users,tickets]=await Promise.all([User.find({}).select('name email role verification verificationNote blocked profile.phone profile.region profile.address').sort({createdAt:-1}).limit(200).lean(),Ticket.find({}).populate('user','name').sort({createdAt:-1}).limit(100).lean()]);return NextResponse.json({users:users.map(u=>({...u,_id:undefined,id:String(u._id)})),tickets:tickets.map(t=>({...t,_id:undefined,id:String(t._id)}))});}catch(e){return fail(e);}}
export async function PATCH(req){try{checkOrigin(req);const admin=await requireAdmin();const b=await req.json();idCheck(b.id);if(b.type==='user'){if(String(admin._id)===b.id)throw new AppError('O‘z hisobingizni bu yerdan o‘zgartirmang');if(!['verified','rejected','pending'].includes(b.verification))throw new AppError('Tekshiruv holati noto‘g‘ri');await User.updateOne({_id:b.id},{$set:{verification:b.verification,verificationNote:str(b.note||'',1000)}});await notify(b.id,'verify:'+Date.now(),'Biznesingizni tekshirish holati yangilandi.','/settings');}
 else if(b.type==='ticket'){if(!['open','reviewing','resolved'].includes(b.status))throw new AppError('Holat noto‘g‘ri');const t=await Ticket.findByIdAndUpdate(b.id,{$set:{status:b.status,reply:str(b.reply||'',2000)}},{new:true});if(!t)throw new AppError('Topilmadi',404);await notify(t.user,'ticket:'+t._id+':'+Date.now(),'Murojaatingizga javob berildi.','/support');}
 else if(b.type==='product'){const p=await Product.findByIdAndUpdate(b.id,{$set:{active:false}});if(!p)throw new AppError('Mahsulot topilmadi',404);await notify(p.seller,'moderation:'+p._id,'Mahsulot moderator tomonidan katalogdan olindi.','/products-manage');}
 else throw new AppError('Amal noto‘g‘ri');return NextResponse.json({ok:true});}catch(e){return fail(e);}}

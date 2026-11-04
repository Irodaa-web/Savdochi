import {NextResponse} from 'next/server';
import {requireUser,checkOrigin,fail,idCheck} from '@/lib/api';
import {Notification} from '@/lib/models';
import {remindHolds} from '@/lib/notifications';
export async function GET(){try{const u=await requireUser();if(u.role==='buyer')await remindHolds(u._id);const [rows,unread]=await Promise.all([Notification.find({user:u._id}).sort({createdAt:-1}).limit(100).lean(),Notification.countDocuments({user:u._id,read:false})]);return NextResponse.json({unread,notifications:rows.map(n=>({id:String(n._id),text:n.text,href:n.href,read:n.read,createdAt:n.createdAt}))});}catch(e){return fail(e);}}
export async function PATCH(req){try{checkOrigin(req);const u=await requireUser();const {id}=await req.json();if(id)idCheck(id);await Notification.updateMany({user:u._id,...(id?{_id:id}:{})},{$set:{read:true}});return NextResponse.json({ok:true});}catch(e){return fail(e);}}

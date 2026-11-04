import crypto from 'node:crypto';
import {RateLimit} from '@/lib/models';
import {AppError} from '@/lib/commerce.mjs';
export async function limit(key,max=10,windowMs=900000){const bucket=Math.floor(Date.now()/windowMs),id=crypto.createHash('sha256').update(key+':'+bucket).digest('hex');const r=await RateLimit.findOneAndUpdate({_id:id},{$inc:{count:1},$setOnInsert:{expiresAt:new Date((bucket+1)*windowMs)}},{upsert:true,new:true});if(r.count>max)throw new AppError('Urinishlar ko‘p. 15 daqiqadan keyin qayta urinib ko‘ring.',429);}
export const clientKey=req=>(req.headers.get('x-vercel-forwarded-for')||req.headers.get('x-forwarded-for')||'unknown').split(',')[0].trim();

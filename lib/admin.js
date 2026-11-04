import {requireUser} from '@/lib/api';
import {AppError} from '@/lib/commerce.mjs';
export function isAdmin(user){return (process.env.ADMIN_EMAILS||'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean).includes(user.email?.toLowerCase());}
export async function requireAdmin(){const u=await requireUser();if(!isAdmin(u))throw new AppError('Administrator ruxsati kerak',403);return u;}

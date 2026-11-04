import {limit} from '@/lib/rateLimit';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import {NextResponse} from 'next/server';
import {requireUser,checkOrigin,fail} from '@/lib/api';
import {User} from '@/lib/models';
import {AppError} from '@/lib/commerce.mjs';
import {createSession,setSession} from '@/lib/auth';
export async function POST(req){try{checkOrigin(req);const u=await requireUser();const {password,newPassword}=await req.json();await limit('security:'+u._id,10);const current=await User.findById(u._id);if(typeof password!=='string'||!await bcrypt.compare(password,current.passwordHash))throw new AppError('Joriy parol noto‘g‘ri',401);if(newPassword&&(typeof newPassword!=='string'||newPassword.length<8||newPassword.length>72))throw new AppError('Yangi parol 8–72 belgi bo‘lsin');const recoveryCode=crypto.randomBytes(24).toString('hex');current.recoveryHash=crypto.createHash('sha256').update(recoveryCode).digest('hex');if(newPassword){current.passwordHash=await bcrypt.hash(newPassword,12);current.authVersion=(current.authVersion||0)+1;}await current.save();const res=NextResponse.json({recoveryCode});setSession(res,createSession(current));return res;}catch(e){return fail(e);}}

import {limit,clientKey} from '@/lib/rateLimit';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import {NextResponse} from 'next/server';
import {connectDB} from '@/lib/mongodb';
import {User} from '@/lib/models';
import {checkOrigin,fail} from '@/lib/api';
import {AppError} from '@/lib/commerce.mjs';
export async function POST(req){try{checkOrigin(req);const {email,code,password}=await req.json();if(typeof email!=='string'||typeof code!=='string'||! /^[a-f\d]{48}$/i.test(code)||typeof password!=='string'||password.length<8||password.length>72)throw new AppError('Email, tiklash kodi va yangi parolni tekshiring');await connectDB();await Promise.all([limit('recover:'+email.trim().toLowerCase(),5),limit('recover-ip:'+clientKey(req),20)]);const hash=crypto.createHash('sha256').update(code.toLowerCase()).digest('hex');const updated=await User.findOneAndUpdate({email:email.trim().toLowerCase(),recoveryHash:hash,blocked:{$ne:true}},{$set:{passwordHash:await bcrypt.hash(password,12)},$unset:{recoveryHash:1},$inc:{authVersion:1}});if(!updated)throw new AppError('Email yoki tiklash kodi noto‘g‘ri',400);return NextResponse.json({ok:true});}catch(e){return fail(e);}}

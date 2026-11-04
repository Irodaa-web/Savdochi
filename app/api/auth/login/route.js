import {demoEmails} from '@/lib/demo-access.mjs';
import {NextResponse} from 'next/server';
import bcrypt from 'bcryptjs';
import {connectDB} from '@/lib/mongodb';
import {User} from '@/lib/models';
import {createSession,setSession} from '@/lib/auth';
import {checkOrigin,fail} from '@/lib/api';
import {AppError} from '@/lib/commerce.mjs';
import {limit,clientKey} from '@/lib/rateLimit';
export async function POST(req){try{checkOrigin(req);const {email,password}=await req.json();if(typeof email!=='string'||email.length>254||typeof password!=='string'||password.length>72)throw new AppError('Email va parolni tekshiring');await connectDB();const normalized=email.trim().toLowerCase();await Promise.all([...(Object.values(demoEmails).includes(normalized)?[]:[limit('login:'+normalized,15)]),limit('login-ip:'+clientKey(req),100)]);const user=await User.findOne({email:normalized});if(!user||user.blocked||!await bcrypt.compare(password,user.passwordHash))throw new AppError('Email yoki parol noto‘g‘ri',401);const res=NextResponse.json({user:{id:String(user._id),name:user.name,email:user.email,role:user.role}});setSession(res,createSession(user));return res;}catch(e){return fail(e);}}

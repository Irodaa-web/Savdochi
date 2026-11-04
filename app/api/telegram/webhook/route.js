import crypto from 'node:crypto';
import {NextResponse} from 'next/server';
import {connectDB} from '@/lib/mongodb';
import {User} from '@/lib/models';
import {fail} from '@/lib/api';
export async function POST(req){try{const secret=process.env.TELEGRAM_WEBHOOK_SECRET,provided=req.headers.get('x-telegram-bot-api-secret-token')||'';if(!secret||provided.length!==secret.length||!crypto.timingSafeEqual(Buffer.from(secret),Buffer.from(provided)))return NextResponse.json({ok:false},{status:403});const body=await req.json(),m=body.message,code=m?.text?.match(/^\/start ([a-f0-9]{48})$/)?.[1];if(code&&m.chat?.type==='private'&&m.from?.id===m.chat.id){await connectDB();await User.findOneAndUpdate({telegramLinkHash:crypto.createHash('sha256').update(code).digest('hex'),telegramLinkExpires:{$gt:new Date()}},{$set:{telegramChatId:String(m.chat.id)},$unset:{telegramLinkHash:1,telegramLinkExpires:1}});}return NextResponse.json({ok:true});}catch(e){return fail(e);}}

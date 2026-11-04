import {requirePersonalAccount} from '@/lib/demo-access.mjs';
import crypto from 'node:crypto';
import {NextResponse} from 'next/server';
import {requireUser,checkOrigin,fail} from '@/lib/api';
import {User} from '@/lib/models';
import {AppError} from '@/lib/commerce.mjs';
const configured=()=>!!(process.env.TELEGRAM_BOT_TOKEN&&process.env.TELEGRAM_BOT_USERNAME&&process.env.TELEGRAM_WEBHOOK_SECRET);
export async function GET(){try{const u=await requireUser();requirePersonalAccount(u);const row=await User.findById(u._id).select('telegramChatId');return NextResponse.json({configured:configured(),linked:!!row.telegramChatId});}catch(e){return fail(e);}}
export async function POST(req){try{checkOrigin(req);const u=await requireUser();requirePersonalAccount(u);if(!configured())throw new AppError('Telegram boti hali sozlanmagan',503);const code=crypto.randomBytes(24).toString('hex');await User.updateOne({_id:u._id},{$set:{telegramLinkHash:crypto.createHash('sha256').update(code).digest('hex'),telegramLinkExpires:new Date(Date.now()+600000)}});return NextResponse.json({url:'https://t.me/'+process.env.TELEGRAM_BOT_USERNAME+'?start='+code});}catch(e){return fail(e);}}
export async function DELETE(req){try{checkOrigin(req);const u=await requireUser();requirePersonalAccount(u);await User.updateOne({_id:u._id},{$unset:{telegramChatId:1,telegramLinkHash:1,telegramLinkExpires:1}});return NextResponse.json({ok:true});}catch(e){return fail(e);}}

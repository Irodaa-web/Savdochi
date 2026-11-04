import {NextResponse} from 'next/server';
import {requireUser,fail} from '@/lib/api';
import {isAdmin} from '@/lib/admin';
export async function GET(){try{const u=await requireUser();return NextResponse.json({user:{id:String(u._id),name:u.name,email:u.email,role:u.role,isDemo:!!u.isDemo,isAdmin:isAdmin(u),verification:u.verification,profile:u.profile,favorites:(u.favorites||[]).map(String)}});}catch(e){return fail(e);}}

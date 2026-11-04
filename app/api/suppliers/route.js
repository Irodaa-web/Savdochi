import {NextResponse} from 'next/server';
import {connectDB} from '@/lib/mongodb';
import {User} from '@/lib/models';
import {publicProfile} from '@/lib/business.mjs';
import {fail} from '@/lib/api';
export async function GET(){try{await connectDB();const rows=await User.find({role:'seller',blocked:{$ne:true}}).select('name role profile verification').sort({name:1}).limit(500).lean();return NextResponse.json({suppliers:rows.map(publicProfile)});}catch(e){return fail(e);}}

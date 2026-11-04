import {marketFilter} from '@/lib/demo-access.mjs';
import {NextResponse} from 'next/server';
import {connectDB} from '@/lib/mongodb';
import {User,Product} from '@/lib/models';
import {publicProfile} from '@/lib/business.mjs';
import {fail,optionalUser} from '@/lib/api';
export async function GET(){try{await connectDB();const viewer=await optionalUser();const activeSellers=await Product.distinct('seller',{active:true});const rows=await User.find({...marketFilter(viewer),role:'seller',blocked:{$ne:true},$or:[{_id:{$in:activeSellers}},{'profile.phone':{$nin:['',null]},'profile.region':{$nin:['',null]}}]}).select('name role profile verification').sort({name:1}).limit(500).lean();return NextResponse.json({suppliers:rows.map(publicProfile)});}catch(e){return fail(e);}}

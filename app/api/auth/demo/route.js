import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import {NextResponse} from 'next/server';
import {connectDB} from '@/lib/mongodb';
import {User,Product,Partnership,Chat,DemoSeed} from '@/lib/models';
import {checkOrigin,fail} from '@/lib/api';
import {AppError} from '@/lib/commerce.mjs';
import {demoEmails,demoPassword} from '@/lib/demo-access.mjs';
import {limit,clientKey} from '@/lib/rateLimit';
export async function POST(req){let session;try{
 checkOrigin(req);const {role}=await req.json();if(!['seller','buyer'].includes(role))throw new AppError('Demo turini tanlang');await connectDB();await limit('demo-prepare:'+clientKey(req),60);
 await Promise.all([User.init(),Product.init(),Partnership.init(),Chat.init(),DemoSeed.init()]);
 if(!await DemoSeed.exists({_id:'v1',ready:true})){
  const hash=await bcrypt.hash(demoPassword,12);session=await mongoose.startSession();await session.withTransaction(async()=>{
   const seed=await DemoSeed.findOneAndUpdate({_id:'v1'},{$setOnInsert:{ready:false}},{upsert:true,new:true,session});if(seed.ready)return;
   if(await User.exists({email:{$in:Object.values(demoEmails)}}).session(session))throw new AppError('Demo manzili band. Administratorga murojaat qiling.',409);
   const [seller,buyer]=await User.create([
    {name:'Demo Ta’minot kompaniyasi',email:demoEmails.seller,passwordHash:hash,role:'seller',isDemo:true,profile:{phone:'+998000000000',region:'Toshkent',district:'Demo tuman',address:'Demo ombor, 1-uy',description:'Sinov uchun ulgurji ta’minot kompaniyasi',brands:['Demo Food'],deliveryAreas:['Toshkent'],deliveryDays:['Dushanba','Chorshanba','Juma'],deliveryLeadDays:1,minOrderTotal:0,deliveryFee:0,paymentMethods:['Naqd','Bank o‘tkazmasi'],holdLimit:10000}},
    {name:'Demo Mahalla do‘koni',email:demoEmails.buyer,passwordHash:hash,role:'buyer',isDemo:true,profile:{phone:'+998000000001',region:'Toshkent',district:'Demo tuman',address:'Demo ko‘cha, 12-do‘kon',description:'Sinov uchun oziq-ovqat do‘koni'}}
   ],{session,ordered:true});
   await Product.create([
    {name:'Ichimlik suvi 1,5 litr',category:'Ichimliklar',price:24000,unit:'1 blok',packSize:6,innerUnit:'butilka',stock:300,minOrder:2,priceTiers:[{min:10,price:22000}],description:'Bir blokda 6 ta butilka. Demo mahsulot.'},
    {name:'Guruch',category:'Oziq-ovqat',price:180000,unit:'10 kg qop',packSize:10,innerUnit:'kg',stock:100,minOrder:1,priceTiers:[{min:5,price:170000}],description:'Ulgurji savdo uchun demo mahsulot.'},
    {name:'Idish yuvish vositasi',category:'Maishiy kimyo',price:96000,unit:'1 quti',packSize:12,innerUnit:'dona',stock:80,minOrder:1,description:'Bir qutida 12 dona. Demo mahsulot.'}
   ].map(p=>({...p,seller:seller._id,supplier:seller.name,isDemo:true})),{session,ordered:true});
   await Partnership.create([{buyer:buyer._id,seller:seller._id,requestedBy:buyer._id,status:'accepted',discount:5,terms:'Demo hamkor uchun 5% chegirma'}],{session});
   await Chat.create([{buyer:buyer._id,seller:seller._id}],{session});
   await DemoSeed.updateOne({_id:'v1'},{$set:{ready:true}},{session});
  });
 }
 return NextResponse.json({email:demoEmails[role],password:demoPassword,role});
 }catch(e){return fail(e);}finally{await session?.endSession();}}

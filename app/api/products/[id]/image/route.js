import {Product} from '@/lib/models';
import {connectDB} from '@/lib/mongodb';
import {idCheck,fail} from '@/lib/api';
export async function GET(req,{params}){try{const {id}=await params;idCheck(id);await connectDB();const p=await Product.findOne({_id:id,active:true}).select('image').lean();if(!p?.image)return new Response(null,{status:404});const [head,data]=p.image.split(',');return new Response(Buffer.from(data,'base64'),{headers:{'Content-Type':head.slice(5).split(';')[0],'Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});}catch(e){return fail(e);}}

import mongoose from "mongoose";
const uri=process.env.MONGODB_URI;
if(!globalThis.__savdochiMongo)globalThis.__savdochiMongo={conn:null,promise:null};
export async function connectDB(){if(!uri)throw new Error("MONGODB_URI sozlanmagan");const cache=globalThis.__savdochiMongo;if(cache.conn)return cache.conn;if(!cache.promise)cache.promise=mongoose.connect(uri,{serverSelectionTimeoutMS:10000});try{cache.conn=await cache.promise;return cache.conn}catch(e){cache.promise=null;throw e}}

import crypto from "node:crypto";
const secret=()=>process.env.AUTH_SECRET;
function sign(value){return crypto.createHmac("sha256",secret()).update(value).digest("base64url")}
export function createSession(user){if(!secret())throw new Error("AUTH_SECRET sozlanmagan");const payload=Buffer.from(JSON.stringify({id:String(user._id),role:user.role,exp:Date.now()+7*86400000})).toString("base64url");return payload+"."+sign(payload)}
export function verifySession(token){if(!secret()||!token)return null;const [payload,signature]=token.split(".");if(!payload||!signature)return null;const expected=sign(payload);if(signature.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;try{const data=JSON.parse(Buffer.from(payload,"base64url").toString());return data.exp>Date.now()?data:null}catch{return null}}
export function setSession(response,token){response.cookies.set("savdochi_session",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:7*86400})}

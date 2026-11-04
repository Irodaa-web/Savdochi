import crypto from "node:crypto";
const SESSION_EPOCH=1; // One-time global sign-out for the demo-account rollout.
const secret=()=>process.env.AUTH_SECRET;
function sign(value){return crypto.createHmac("sha256",secret()).update(value).digest("base64url")}
export function createSession(user){if(!secret())throw new Error("AUTH_SECRET sozlanmagan");const payload=Buffer.from(JSON.stringify({epoch:SESSION_EPOCH,id:String(user._id),role:user.role,version:user.authVersion||0,exp:Date.now()+7*86400000})).toString("base64url");return payload+"."+sign(payload)}
export function verifySession(token){if(!secret()||!token)return null;const [payload,signature]=token.split(".");if(!payload||!signature)return null;const expected=sign(payload);if(signature.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(signature),Buffer.from(expected)))return null;try{const data=JSON.parse(Buffer.from(payload,"base64url").toString());return data.epoch===SESSION_EPOCH&&data.exp>Date.now()?data:null}catch{return null}}
export function setSession(response,token){response.cookies.set("savdochi_session",token,{httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",maxAge:7*86400})}

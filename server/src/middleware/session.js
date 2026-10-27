import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

const COOKIE='amr_session';
function sign(value){return createHmac('sha256',env.sessionSecret).update(value).digest('base64url');}
export function session(req,res,next){
  const raw=req.cookies?.[COOKIE];
  if(raw){const [id,signature]=raw.split('.');const expected=sign(id||'');try{if(id&&signature&&timingSafeEqual(Buffer.from(signature),Buffer.from(expected))){req.sessionId=id;return next();}}catch{}}
  const id=randomBytes(32).toString('base64url');req.sessionId=id;
  res.cookie(COOKIE,`${id}.${sign(id)}`,{httpOnly:true,sameSite:'lax',secure:env.nodeEnv==='production',maxAge:30*24*60*60*1000,path:'/'});next();
}

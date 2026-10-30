import { randomBytes, createHash } from 'node:crypto';
const digest=value=>createHash('sha256').update(value).digest('hex');
export function createSessions({idleMs=30*60*1000,maxMs=8*60*60*1000,secure=false,now=Date.now,maxSessions=512}={}){
 const entries=new Map();const cookieName=secure?'__Host-ielts_ai':'ielts_ai';
 function dispose(s){s.controller?.abort();s.controller=null;s.key='';s.generation++;}
 function purge(){for(const [id,s]of entries)if(now()-s.lastSeen>=idleMs||now()-s.createdAt>=maxMs){dispose(s);entries.delete(id);}}
 const timer=setInterval(purge,60000);timer.unref();
 const cookie=(value,clear=false)=>`${cookieName}=${value}; Path=/; HttpOnly; SameSite=Strict${secure?'; Secure':''}${clear?'; Max-Age=0':''}`;
 function find(req,touch=true){purge();const raw=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith(cookieName+'='))?.slice(cookieName.length+1);if(!raw||!/^[A-Za-z0-9_-]{43}$/.test(raw))return undefined;const s=entries.get(digest(raw));if(s&&touch)s.lastSeen=now();return s;}
 function create(res){purge();if(entries.size>=maxSessions)return undefined;const token=randomBytes(32).toString('base64url');const s={id:digest(token),csrf:randomBytes(32).toString('base64url'),key:'',provider:'openai',model:'gpt-4.1-mini',createdAt:now(),lastSeen:now(),generation:0,connection:'unconfigured',testedAt:null,controller:null};entries.set(s.id,s);res.setHeader('Set-Cookie',cookie(token));return s;}
 function clear(req,res){const s=find(req);if(s){dispose(s);entries.delete(s.id);}res.setHeader('Set-Cookie',cookie('',true));}
 function replace(s,{key,provider,model}){dispose(s);s.key=key;s.provider=provider;s.model=model;s.connection='untested';s.testedAt=null;s.lastSeen=now();}
 function state(s){return {configured:!!s?.key,provider:s?.provider||'openai',model:s?.model||'gpt-4.1-mini',connection:s?.key?s.connection:'unconfigured',testedAt:s?.testedAt||null,expiresAt:s?new Date(Math.min(s.lastSeen+idleMs,s.createdAt+maxMs)).toISOString():null,csrfToken:s?.csrf||null};}
 return {find,create,clear,replace,state,purge,stop:()=>{clearInterval(timer);for(const s of entries.values())dispose(s);entries.clear();},cookieName};
}

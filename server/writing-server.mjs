import { speakingBank, validateSpeakingInput, speakingMessages } from './speaking-core.mjs';
import http from 'node:http';
import { pathToFileURL } from 'node:url';
import { randomUUID, timingSafeEqual } from 'node:crypto';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { materials, retrieve, validateInput, feedbackSchema, validFeedback, buildMessages } from './writing-core.mjs';
import { createSessions } from './ai-sessions.mjs';
import { providers, publicProviders, providerError, validModel } from './ai-providers.mjs';
const send=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
const csrfValid=(expected,actual)=>typeof actual==='string'&&/^[A-Za-z0-9_-]{43}$/.test(actual)&&expected.length===actual.length&&timingSafeEqual(Buffer.from(expected),Buffer.from(actual));
async function jsonBody(req,limit=100000){if(!req.headers['content-type']?.startsWith('application/json'))throw {status:415,error:'需要 JSON 请求。'};req.setEncoding('utf8');let raw='';for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>limit)throw {status:413,error:'提交内容过长。'};}try{return JSON.parse(raw);}catch{throw {status:400,error:'请求格式无效。'};}}
export function createWritingServer({fetchImpl=fetch,readMaterials=materials,secureCookies=process.env.COOKIE_SECURE==='true',appOrigin=process.env.APP_ORIGIN||process.env.RENDER_EXTERNAL_URL||'',staticDir,sessionOptions={},minInterval=1500}={}){
 // Deliberately no environment API key, owner key, or shared fallback.
 const sessions=createSessions({...sessionOptions,secure:secureCookies});let busy=0;const recent=new Map();
 const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Robots-Tag','noindex, nofollow');res.setHeader('Referrer-Policy','no-referrer');
 const origin=req.headers.origin;let path;try{path=new URL(req.url,'http://local.invalid').pathname;}catch{return send(res,400,{error:'路径无效。'});}
 if(path.startsWith('/api/')){
  if(req.headers['sec-fetch-site']==='cross-site')return send(res,403,{error:'不接受跨站请求。'});
  if(origin){try{const expected=appOrigin?new URL(appOrigin).origin:`${secureCookies?'https':'http'}://${req.headers.host}`;if(new URL(origin).origin!==expected)return send(res,403,{error:'请求来源不匹配。'});}catch{return send(res,403,{error:'请求来源无效。'});}}
  // HTTP is permitted for local development only. Public BYOK requires HTTPS cookies.
  if(!secureCookies&&origin&&!/^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/.test(origin))return send(res,403,{error:'公网 AI 设置必须使用 HTTPS 安全会话。'});
  if(path==='/api/writing/questions'&&req.method==='GET')return send(res,200,{prompts:[],originalQuestionsVerified:false,reason:'当前论点库未检出可核验的完整原题；不使用改编题或 DEMO。'});
  if(path==='/api/ai/providers'&&req.method==='GET')return send(res,200,{providers:publicProviders()});
  if(path==='/api/ai/settings'&&req.method==='GET'){
   const s=sessions.find(req)||sessions.create(res);if(!s)return send(res,503,{error:'预览会话已满，请稍后重试。'});return send(res,200,sessions.state(s));
  }
  const s=sessions.find(req);
  if(path==='/api/writing/status'&&req.method==='GET')return send(res,200,{...sessions.state(s),materials:readMaterials().length>0});
  if(!['POST','DELETE'].includes(req.method))return send(res,404,{error:'接口不存在。'});
  if(!s||!csrfValid(s.csrf,req.headers['x-csrf-token']))return send(res,403,{error:'会话已过期或校验失败，请返回 AI Settings 刷新。',code:'SESSION_EXPIRED'});
  if(path==='/api/ai/settings'&&req.method==='DELETE'){sessions.clear(req,res);return send(res,200,{configured:false,connection:'unconfigured'});}
  if(path==='/api/ai/settings'&&req.method==='POST'){
   let body;try{body=await jsonBody(req,12000);}catch(e){return send(res,e.status||400,{error:e.error||'请求无效。'});}
   if(!body||typeof body!=='object'||Array.isArray(body))return send(res,400,{error:'请求格式无效。'});
   const provider=body.provider||'openai';const key=typeof body.key==='string'?body.key.trim():'';const model=body.model;
   if(typeof provider!=='string'||!Object.hasOwn(providers,provider)||!validModel(model))return send(res,400,{error:'请选择支持的服务商和有效模型名称。'});
   if(key&&(!/^[\x21-\x7e]{16,4096}$/.test(key)))return send(res,400,{error:'密钥格式无效，请重新输入。'});
   if(!key&&!s.key)return send(res,400,{error:'请填写你自己的 API Key。'});
   sessions.replace(s,{key:key||s.key,provider,model});return send(res,200,sessions.state(s));
  }
  const isTest=path==='/api/ai/test'&&req.method==='POST';const isSpeaking=path==='/api/speaking/feedback'&&req.method==='POST';const isFeedback=(path==='/api/writing/feedback'||isSpeaking)&&req.method==='POST';if(!isTest&&!isFeedback)return send(res,404,{error:'接口不存在。'});
  if(!s.key)return send(res,428,{error:'请先在 AI Settings 配置你自己的 API Key。',code:'AI_CONFIG_REQUIRED'});
  let input;if(isFeedback){try{input=await jsonBody(req);}catch(e){return send(res,e.status||400,{error:e.error||'请求无效。'});}if(!(isSpeaking?validateSpeakingInput(input,speakingBank()):validateInput(input)))return send(res,400,{error:isSpeaking?'请先填写完整的本人回答或 Part 3 框架，并检查题库版本；不完整原题不进入 AI 分析。':'请填写完整中文框架；英文或全文检查还需要对应稿件。'});}
  if(busy>=4||s.controller)return send(res,429,{error:'已有检查正在进行，请稍后重试。'});
  if(Date.now()-(recent.get(s.id)||0)<minInterval)return send(res,429,{error:'请求较频繁，请稍后重试。'});
  // Bound metadata as well as secret sessions.
  if(recent.size>1024)recent.clear();recent.set(s.id,Date.now());busy++;
  const generation=s.generation;const controller=new AbortController();s.controller=controller;const timer=setTimeout(()=>controller.abort(),isTest?15000:60000);
  try{
   const provider=providers[s.provider];
   const refs=isFeedback&&!isSpeaking?retrieve(readMaterials(),JSON.stringify(input.fields),input.mode):[];
   const response=isTest?await provider.test({key:s.key,model:s.model,fetchImpl,signal:controller.signal}):await provider.feedback({key:s.key,model:s.model,fetchImpl,signal:controller.signal,messages:isSpeaking?speakingMessages(input,speakingBank()):buildMessages(input,refs),schema:feedbackSchema});
   if(generation!==s.generation||!sessions.find(req,false)?.key)return send(res,409,{error:'AI 配置已修改或清除，请重新发起检查。'});
   if(!response.ok){if(response.status===401||response.status===403){s.connection='failed';s.testedAt=null;}return send(res,response.status===429?429:response.status===401?401:502,{error:providerError(response.status)});}
   if(isTest){s.connection='connected';s.testedAt=new Date().toISOString();return send(res,200,{...sessions.state(s),message:'密钥与所选模型可访问。未生成文本；实际检查仍受账户额度与速率限制。'});}
   const result=await response.json();if(result.status!=='completed')throw Error('incomplete');
   const content=result.output?.flatMap(x=>x.content||[]).filter(x=>x.type==='output_text').map(x=>x.text).join('');const feedback=JSON.parse(content||'null');if(!validFeedback(feedback))throw Error('invalid');if(input.mode==='logic'||isSpeaking&&input.phase==='logic')feedback.issues=feedback.issues.map(i=>({...i,suggestion:''}));
   const student=Object.values(isSpeaking?input.response:input.fields).join('\n')+(input.english||'')+(input.essay||'');if(feedback.issues.some(i=>i.quote&&!student.includes(i.quote)))throw Error('unanchored');
   if(generation!==s.generation||!sessions.find(req,false)?.key)return send(res,409,{error:'会话已清除，结果未返回。'});
   s.connection='connected';return send(res,200,{id:randomUUID(),provider:'OpenAI',model:s.model,at:new Date().toISOString(),responseId:result.id,mode:isSpeaking?'speaking':input.mode,...(isSpeaking?{questionId:input.questionId,phase:input.phase}:{}),feedback,references:refs.map(r=>({id:r.id,sources:r.sources})),...(input.mode==='english'?{expressions:refs.map(r=>({text:r.text,sources:r.sources}))}:{})});
  }catch{return send(res,502,{error:controller.signal.aborted?'请求已取消或超时，未保存反馈。':'AI 未返回可验证的完整反馈，或网络暂不可用。未生成替代分析。'});}finally{clearTimeout(timer);if(s.controller===controller)s.controller=null;busy--;}
 }
 if(!staticDir)return send(res,404,{error:'页面不存在。'});
 if(!['GET','HEAD'].includes(req.method))return send(res,405,{error:'请求方法不支持。'});
 const base='/ielts-knowledge-workspace/';if(path==='/'||path===base.slice(0,-1)){res.writeHead(302,{Location:base});return res.end();}
 if(!path.startsWith(base))return send(res,404,{error:'页面不存在。'});
 let file;try{const root=resolve(staticDir);file=resolve(root,decodeURIComponent(path.slice(base.length))||'index.html');if(file!==root&&!file.startsWith(root+sep))return send(res,403,{error:'路径无效。'});if(!existsSync(file)||!statSync(file).isFile())return send(res,404,{error:'文件不存在。'});}catch{return send(res,400,{error:'路径无效。'});}
 const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.woff':'font/woff','.woff2':'font/woff2','.svg':'image/svg+xml'};
 res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':extname(file)==='.html'?'no-cache':'public, max-age=3600','X-Content-Type-Options':'nosniff','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'"});if(req.method==='HEAD')return res.end();createReadStream(file).pipe(res);
 });
 server.on('close',()=>sessions.stop());return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const production=process.env.NODE_ENV==='production';const server=createWritingServer({staticDir:production?resolve('dist'):undefined,secureCookies:production||process.env.COOKIE_SECURE==='true'});const port=Number(process.env.PORT||process.env.WRITING_PORT||8787);const host=process.env.WRITING_HOST||(production?'0.0.0.0':'127.0.0.1');server.listen(port,host,()=>console.log(`IELTS ${production?'preview':'AI'} server ready on ${host}:${port}; BYOK only`));}

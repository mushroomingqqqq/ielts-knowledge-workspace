// Providers own their endpoints and request formats. Never accept arbitrary upstream URLs.
export const providers={
 openai:{id:'openai',label:'OpenAI',defaultModel:'gpt-4.1-mini',models:['gpt-4.1-mini','gpt-4.1','gpt-4o-mini','gpt-4o'],
  test:async({key,model,fetchImpl,signal})=>fetchImpl(`https://api.openai.com/v1/models/${encodeURIComponent(model)}`,{headers:{Authorization:`Bearer ${key}`},signal}),
  feedback:async({key,model,fetchImpl,signal,messages,schema})=>fetchImpl('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},signal,body:JSON.stringify({model,store:false,input:messages,max_output_tokens:5000,text:{format:{type:'json_schema',name:'writing_feedback',strict:true,schema}}})})
 }
};
export const publicProviders=()=>Object.values(providers).map(({id,label,defaultModel,models})=>({id,label,defaultModel,models}));
export const validModel=model=>typeof model==='string'&&!model.startsWith('sk-')&&/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,119}$/.test(model);
export function providerError(status){return status===401?'密钥无效，请在 AI Settings 中修改。':status===403?'当前密钥没有此模型的访问权限。':status===404?'模型不存在或当前账户不可访问。':status===429?'当前用户的额度或速率受限，请稍后重试。':'AI 服务请求失败，请稍后重试。';}

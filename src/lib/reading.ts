import type { SpeakingData } from './speaking';
import type { WritingData } from './writing';
import { pruneDiscovery, validDiscovery, discoveryPriority, type DiscoveryMatch, type DiscoveryProgress, type DiscoveryOrigin } from './discovery';
import type { Note } from './model';
export type Status = '待复习' | '已掌握';
export const relationships = ['Synonym','Paraphrase','Word Form','Explanation','Specificity','Logical Relation'] as const;
export type Relationship = typeof relationships[number];
export const relationshipLabels: Record<Relationship,string> = {Synonym:'近义词替换',Paraphrase:'短语 / 句子改写','Word Form':'词性 / 词形转换',Explanation:'解释性表达',Specificity:'概括与具体化','Logical Relation':'因果 / 条件等逻辑关系'};
export type Article = {isDemo?:boolean;id:string;title:string;practiceDate:string;total:number|null;correct:number|null;originalText:string;translation:string;createdAt:string;updatedAt:string};
export type Mapping = {needsVerification?:boolean;isStandard?:boolean;discoveryId?:string;discoveryRecognition?:DiscoveryOrigin;discoveryBaselineRecognition?:'认出'|'未认出';learningResetAt?:string;networkId?:string;usage?:NetworkKind;sentence?:string;rationale?:string;id:string;articleId:string;questionId:string;paragraph:string;questionExpression:string;originalExpression:string;meaning:string;relationship:Relationship;context:string;chain:string;recognition:'认出'|'未认出';status:Status;createdAt:string;updatedAt:string};
export type VocabularyLink = {mappingId:string;vocabularyId:string};
export type Attempt = {id:string;mappingId:string;direction:'forward'|'reverse';response:string;success:boolean;at:string};
export type NetworkKind='exact'|'contextual'|'form'|'paraphrase'|'other';
export const networkKinds:Record<NetworkKind,string>={exact:'完全同义（限定用法）',contextual:'语境中的近义替换',form:'词性 / 词形变化',paraphrase:'短语 / 句子表达转换',other:'解释 / 概括 / 逻辑关系'};
export type RelationNetwork={id:string;title:string;terms:string[];kind:NetworkKind;explanation:string;isDemo:boolean;createdAt:string;updatedAt:string};
export type ReviewSession={mappingId:string;direction:'forward'|'reverse';mode:'random'|'forward'|'reverse';scope:string;dataset:Dataset;response:string;revealed:boolean;attemptId?:string};
export type Dataset='全部'|'真实'|'DEMO';
export type Workspace = {speaking?:SpeakingData;writing?:WritingData;discoveries:DiscoveryMatch[];discoveryProgress:DiscoveryProgress[];networks:RelationNetwork[];reviewSession?:ReviewSession|null;version:2;notes:Note[];articles:Article[];mappings:Mapping[];links:VocabularyLink[];attempts:Attempt[]};
export const emptyWorkspace = ():Workspace=>({version:2,discoveries:[],discoveryProgress:[],networks:[],reviewSession:null,notes:[],articles:[],mappings:[],links:[],attempts:[]});
export function articleStatus(s:Workspace,id:string):string {
 const items=[...s.notes.filter(n=>n.articleId===id),...s.mappings.filter(m=>m.articleId===id)];
 return !items.length?'待整理':items.some(n=>n.status==='待复习')?'待复习':'已掌握';
}
export function cleanRemoved(s:Workspace,noteIds:string[],mappingIds:string[]=[]):Workspace {
 const removedNotes=new Set(noteIds);
 if(s.speaking)s={...s,speaking:{...s.speaking,storyLinks:s.speaking.storyLinks.filter(l=>!removedNotes.has(l.storyId))}};
 const removedMappings=new Set([...mappingIds,...s.mappings.filter(m=>removedNotes.has(m.questionId)).map(m=>m.id)]);
 return pruneDiscovery({...s,reviewSession:s.reviewSession&&removedMappings.has(s.reviewSession.mappingId)?null:s.reviewSession,notes:s.notes.filter(n=>!removedNotes.has(n.id)).map(n=>({...n,storyId:n.storyId&&removedNotes.has(n.storyId)?undefined:n.storyId,sourceTitle:n.sourceId&&removedNotes.has(n.sourceId)?s.notes.find(q=>q.id===n.sourceId)?.title||n.sourceTitle:n.sourceTitle,sourceId:n.sourceId&&removedNotes.has(n.sourceId)?undefined:n.sourceId})),mappings:s.mappings.filter(m=>!removedMappings.has(m.id)),links:s.links.filter(l=>!removedMappings.has(l.mappingId)&&!removedNotes.has(l.vocabularyId)),attempts:s.attempts.filter(a=>!removedMappings.has(a.mappingId))},removedNotes,removedMappings);
}
export function validWorkspace(s:Workspace):boolean {
 const ids=(items:{id:string}[])=>items.every(n=>n&&typeof n.id==='string'&&n.id.length>0)&&new Set(items.map(n=>n.id)).size===items.length;
 const strings=(item:object,keys:string[])=>keys.every(k=>typeof (item as Record<string,unknown>)[k]==='string');
 const status=(value:unknown)=>value==='待复习'||value==='已掌握';
 return validDiscovery(s)&&Array.isArray(s.networks)&&ids(s.networks)&&s.networks.every(n=>strings(n,['title','explanation','createdAt','updatedAt'])&&n.title.trim().length>0&&n.explanation.trim().length>0&&Array.isArray(n.terms)&&n.terms.every(t=>typeof t==='string')&&new Set(n.terms.map(normalizeTerm)).size>=2&&n.terms.length>=2&&n.terms.every(t=>typeof t==='string'&&t.trim())&&Object.hasOwn(networkKinds,n.kind)&&typeof n.isDemo==='boolean')&&ids(s.notes)&&ids(s.articles)&&ids(s.mappings)&&ids(s.attempts)
 && s.notes.every(n=>strings(n,['title','content','category','answer','correct','createdAt','updatedAt'])&&['Listening','Reading','Writing','Speaking','Vocabulary'].includes(n.subject)&&status(n.status)&&(!n.fields||(typeof n.fields==='object'&&!Array.isArray(n.fields)&&Object.values(n.fields).every(v=>typeof v==='string'))))
 && s.articles.every(a=>strings(a,['title','practiceDate','originalText','translation','createdAt','updatedAt'])&&(a.total===null||Number.isInteger(a.total)&&a.total>0)&&(a.correct===null||a.total!==null&&Number.isInteger(a.correct)&&a.correct>=0&&a.correct<=a.total))
 && s.mappings.every(m=>strings(m,['articleId','questionId','paragraph','questionExpression','originalExpression','meaning','context','chain','createdAt','updatedAt'])&&m.questionExpression.trim().length>0&&m.originalExpression.trim().length>0&&status(m.status)&&(m.recognition==='认出'||m.recognition==='未认出'))
 && s.attempts.every(a=>strings(a,['mappingId','response','at'])&&typeof a.success==='boolean'&&(a.direction==='forward'||a.direction==='reverse'))
 && s.notes.every(n=>(n.subject!=='Reading'||!!n.articleId)&&(!n.originArticleId||s.articles.some(a=>a.id===n.originArticleId))&&(!n.articleId||(n.subject==='Reading'&&s.articles.some(a=>a.id===n.articleId)))&&(!n.storyId||s.notes.some(t=>t.id===n.storyId&&t.recordType==='story'))&&(!n.sourceId||s.notes.some(t=>t.id===n.sourceId&&['Reading','Listening'].includes(t.subject))))
 && s.mappings.every(m=>s.articles.some(a=>a.id===m.articleId)&&s.notes.some(n=>n.id===m.questionId&&n.subject==='Reading'&&n.articleId===m.articleId)&&relationships.includes(m.relationship))
 && s.links.every(l=>s.mappings.some(m=>m.id===l.mappingId)&&s.notes.some(n=>n.id===l.vocabularyId&&n.subject==='Vocabulary'))
 && new Set(s.links.map(l=>`${l.mappingId}:${l.vocabularyId}`)).size===s.links.length
 && s.attempts.every(a=>s.mappings.some(m=>m.id===a.mappingId))
 && s.mappings.every(m=>(!m.needsVerification||(!m.networkId&&!m.isStandard))&&allowedUsages(m.relationship).includes(mappingUsage(m))&&(!m.usage||Object.hasOwn(networkKinds,m.usage))&&(!m.networkId||s.networks.some(n=>n.id===m.networkId&&n.kind===mappingUsage(m)&&n.isDemo===isDemoArticle(s.articles.find(a=>a.id===m.articleId)!))))
 && (!s.reviewSession||(s.mappings.some(m=>!m.needsVerification&&m.id===s.reviewSession!.mappingId&&(s.reviewSession!.dataset==='全部'||isDemoArticle(s.articles.find(a=>a.id===m.articleId)!)===(s.reviewSession!.dataset==='DEMO')))&&['forward','reverse'].includes(s.reviewSession.direction)&&['random','forward','reverse'].includes(s.reviewSession.mode)&&['全部','真实','DEMO'].includes(s.reviewSession.dataset)&&['全部','待复习','已掌握'].includes(s.reviewSession.scope)&&typeof s.reviewSession.response==='string'&&typeof s.reviewSession.revealed==='boolean'&&(!s.reviewSession.attemptId||s.attempts.some(a=>a.id===s.reviewSession!.attemptId&&a.mappingId===s.reviewSession!.mappingId))));
}
export function chooseMapping(s:Workspace,exclude?:string):Mapping|undefined {
 let pool=s.mappings.filter(m=>!m.needsVerification&&m.id!==exclude);if(!pool.length)pool=s.mappings.filter(m=>!m.needsVerification);
 const weight=(m:Mapping)=>{const last=s.attempts.filter(a=>a.mappingId===m.id).at(-1);return m.status==='已掌握'?.25:2+(m.recognition==='未认出'?5:0)+(last&&!last.success?4:0)+discoveryPriority(m);};
 let target=Math.random()*pool.reduce((n,m)=>n+weight(m),0);
 return pool.find(m=>(target-=weight(m))<=0)||pool.at(-1);
}

export function mappingUsage(m:Mapping):NetworkKind{return m.usage||(m.relationship==='Synonym'?'contextual':m.relationship==='Word Form'?'form':m.relationship==='Paraphrase'?'paraphrase':'other');}
export function isDemoArticle(a:Article):boolean{return a.isDemo===true||/^DEMO(?:\s|·|:|：)/i.test(a.title);}
export function articleCode(a:Article):string{return `R-${a.id.replace(/[^a-z0-9]/gi,'').slice(0,8).toUpperCase()}`;}
export function datasetArticles(s:Workspace,dataset:Dataset){return s.articles.filter(a=>dataset==='全部'||isDemoArticle(a)===(dataset==='DEMO'));}
export function datasetMappings(s:Workspace,dataset:Dataset){const ids=new Set(datasetArticles(s,dataset).map(a=>a.id));return s.mappings.filter(m=>ids.has(m.articleId));}
export function readingMetrics(s:Workspace,dataset:Dataset){const articles=datasetArticles(s,dataset),mappings=datasetMappings(s,dataset);return {articles:articles.length,mistakes:s.notes.filter(n=>n.subject==='Reading'&&articles.some(a=>a.id===n.articleId)).length,mappings:mappings.length,pending:mappings.filter(m=>!m.needsVerification&&m.status==='待复习').length};}
export function articleAudit(s:Workspace,a:Article){const registered=s.notes.filter(n=>n.articleId===a.id).length;const expected=a.total===null||a.correct===null?null:a.total-a.correct;return {registered,expected,missing:expected===null?null:Math.max(0,expected-registered),excess:expected!==null&&registered>expected};}
export function normalizeTerm(s:string){return s.trim().toLocaleLowerCase().replace(/\s+/g,' ');}

export function allowedUsages(relationship:Relationship):NetworkKind[]{return relationship==='Synonym'?['contextual','exact']:relationship==='Word Form'?['form']:relationship==='Paraphrase'?['paraphrase']:['other'];}
export function networkKey(n:RelationNetwork){return `${n.isDemo?'demo':'real'}:${n.kind}:${[...new Set(n.terms.map(normalizeTerm))].sort().join('|')}:${normalizeTerm(n.explanation)}`;}

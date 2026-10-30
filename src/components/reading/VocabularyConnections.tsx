import { useEffect, useState } from 'react';
import type { Store } from '../../hooks/useNotes';
import type { Note } from '../../lib/model';
import RelationNetwork from './RelationNetwork';
import { readingLink } from './MappingList';
export default function VocabularyConnections({note,store,notify}:{note:Note;store:Store;notify:(s:string)=>void}){
 const [showNetwork,setShowNetwork]=useState(false);const [editing,setEditing]=useState(false);const [ids,setIds]=useState<string[]>([]);
 const linked=store.data.mappings.filter(m=>store.data.links.some(l=>l.mappingId===m.id&&l.vocabularyId===note.id));
 const referenceIds=linked.filter(m=>m.isStandard).map(m=>m.id).sort().join(',');useEffect(()=>{if(referenceIds)store.disclose(referenceIds.split(','),3,false);},[referenceIds]);
 return <section className="vocabulary-contexts"><h3>Linked Contexts · 语境档案 <small>{linked.length}</small></h3><p className="reading-muted">一个词可以关联多条替换；同一替换也可以连接多个词汇。</p>{note.originArticleId&&<button className="context-link" onClick={()=>readingLink(note.originArticleId!)}>来源文章 · {store.data.articles.find(a=>a.id===note.originArticleId)?.title} ↗</button>}{!note.originArticleId&&note.originArticleTitle&&<p className="reading-muted">来源文章已删除 · {note.originArticleTitle}</p>}{linked.map(m=><button className="vocabulary-context-link" key={m.id} onClick={()=>readingLink(m.articleId,m.id,m.questionId)}><b>{m.questionExpression} → {m.originalExpression}</b><span>{store.data.articles.find(a=>a.id===m.articleId)?.title} · {m.paragraph} · {m.relationship} ↗</span><blockquote>{m.context}</blockquote></button>)}{!linked.length&&<p className="reading-muted">未关联替换。词汇本身仍可独立保存和复习。</p>}
 {linked.some(m=>m.networkId)&&<><button className="network-link" onClick={()=>setShowNetwork(!showNetwork)}>查看跨文章词汇关系网络</button>{showNetwork&&<RelationNetwork store={store} dataset="全部" query="" onlyIds={[...new Set(linked.map(m=>m.networkId).filter((id):id is string=>!!id))]}/>}</>}
 <button className="secondary" onClick={()=>{setIds(linked.map(m=>m.id));setEditing(!editing);}}>{editing?'取消关联编辑':'管理替换关联'}</button>
 {editing&&<div><fieldset className="link-choices"><legend>选择关联替换</legend>{store.data.mappings.map(m=><label key={m.id}><input type="checkbox" checked={ids.includes(m.id)} onChange={()=>setIds(ids.includes(m.id)?ids.filter(id=>id!==m.id):[...ids,m.id])}/>{m.questionExpression} → {m.originalExpression} · {store.data.articles.find(a=>a.id===m.articleId)?.title}</label>)}{!store.data.mappings.length&&<p>先在 Reading 里添加替换记录。</p>}</fieldset><button className="primary" onClick={()=>{if(store.linkVocabulary(note.id,ids)){setEditing(false);notify('词汇关联已保存');}}}>保存关联</button></div>}
 </section>;
}

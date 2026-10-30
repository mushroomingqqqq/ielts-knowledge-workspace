import { useState } from 'react';
import { writingExpressions } from '../../lib/writingExpressions';
export default function ExpressionReference({collect}:{collect:(text:string)=>void}){
 const [query,setQuery]=useState('');const rows=query.trim().length>=2?writingExpressions.filter(x=>(x.topic+x.zh+x.en).toLowerCase().includes(query.trim().toLowerCase())):[];
 return <details className="template-sheet"><summary>查找英文表达 · 资料辅助</summary><label className="writing-field">检索自己的表达需要<input aria-label="英文素材检索" placeholder="例如：教育、交通、carbon" value={query} onChange={e=>setQuery(e.target.value)}/></label>{query.trim().length<2?<p className="reading-muted">先写自己的英文框架，再按关键词查找。这里只摘录少量完整原句，不提供整篇答案。</p>:rows.length?rows.map(row=><article className="writing-expression" key={row.en}><strong>{row.en}</strong><p>{row.zh}</p><small>《浓缩版观点库》PDF 第 {row.page} 页 · 原句照录，使用前需自己核对搭配、适用语境和语法。</small><button className="text-button" onClick={()=>collect(row.en+'\n'+row.zh+'\n来源：《浓缩版观点库》PDF 第 '+row.page+' 页\n我的使用语境：')}>核对后收录表达</button></article>):<p className="reading-muted">当前摘录中未找到该表达。不会生成替代观点或答案。</p>}</details>;
}

import { useEffect, useState, type ReactNode } from 'react';
import { Plus, BookOpen, Pencil, Trash2 } from 'lucide-react';
import type { Note, Subject } from '../lib/model';
import NoteDetails from './NoteDetails';
type Props = {connections?: (note: Note) => ReactNode; subject: Subject; notes: Note[]; query: string; edit: (note: Note) => void; add: () => void; remove: (note: Note) => void; vocabulary: (note: Note) => void; save: (note: Note) => boolean};
export default function Library({subject, notes, query, edit, add, remove, vocabulary, save, connections}: Props) {
 const [filters, setFilters] = useState<Record<string,string>>({});
 const wordRoute=()=>new URLSearchParams(location.hash.split('?')[1]||'').get('word');
 const [expanded, setExpanded] = useState<string | null>(wordRoute);
 useEffect(()=>{const fn=()=>setExpanded(wordRoute());window.addEventListener('hashchange',fn);return()=>window.removeEventListener('hashchange',fn);},[]);
 const all = notes.filter(n => n.subject === subject);
 const filterKeys = subject === 'Reading' ? ['title','questionType','reason','status'] : subject === 'Listening' ? ['category','questionType','reason','status'] : subject === 'Speaking' ? ['category','recordType'] : ['category','status'];
 const value = (n: Note, k: string) => k === 'recordType' ? n.recordType === 'story' ? '共享故事' : '口语题目' : k === 'title' ? n.title : k === 'category' ? n.category : k === 'status' ? n.status : n.fields?.[k] || '';
 const labels: Record<string,string> = {title:'文章',questionType:'题型',reason:'错误原因',status:'复习状态',category:'分类',recordType:'素材类型'};
 const visible = all.filter(n => JSON.stringify(n).toLowerCase().includes(query.toLowerCase()) && filterKeys.every(k => !filters[k] || value(n,k) === filters[k]));
 const groups = subject === 'Reading' ? [...new Set(visible.map(n => n.title))] : ['全部记录'];
 return <section className="panel library-panel"><div className="section-heading"><h2>{subject} <span>{all.length} 条记录</span></h2><button className="primary" onClick={add}><Plus size={16}/>添加记录</button></div><div className="advanced-filters">{filterKeys.map(k => <label key={k}>{labels[k]}<select aria-label={`筛选${labels[k]}`} value={filters[k] || ''} onChange={e => setFilters({...filters,[k]:e.target.value})}><option value="">全部</option>{[...new Set(all.map(n => value(n,k)).filter(Boolean))].map(v => <option key={v}>{v}</option>)}</select></label>)}<button className="text-button" onClick={() => setFilters({})}>重置筛选</button></div>
 {!visible.length && <div className="empty-notes"><BookOpen/><p>暂无匹配记录</p><span>添加新记录，或调整搜索与筛选条件。</span></div>}
 {groups.map(group => <div key={group}>{subject === 'Reading' && <h3 className="article-heading">{group} <small>{visible.filter(n => n.title === group).length} 道错题</small></h3>}{visible.filter(n => subject !== 'Reading' || n.title === group).map(n => <article className="record-card" key={n.id}><div className="record-heading"><button onClick={() => setExpanded(expanded === n.id ? null : n.id)}><strong>{n.title}{n.fields?.questionNumber && ` · Q${n.fields.questionNumber}`}</strong><small>{n.category} · {n.recordType === 'story' ? '共享故事 · ' : ''}{n.status}</small></button><button className="icon-button" aria-label={`编辑 ${n.title}`} onClick={() => edit(n)}><Pencil size={16}/></button><button className="delete-button" aria-label={`删除 ${n.title}`} onClick={() => remove(n)}><Trash2 size={16}/></button></div>{expanded === n.id && <><NoteDetails note={n} notes={notes}/>{connections?.(n)}<div className="record-actions">{['Listening','Reading'].includes(subject) && <button className="secondary" onClick={() => vocabulary(n)}><Plus size={14}/>添加到词汇库</button>}<button className="secondary" onClick={() => save({...n,status:n.status === '待复习' ? '已掌握' : '待复习',updatedAt:new Date().toISOString()})}>{n.status === '待复习' ? '标记已掌握' : '设为待复习'}</button></div></>}</article>)}</div>)}
 </section>;
}

import { useEffect, useRef, useState } from 'react';
import { X, Check } from 'lucide-react';
import { categories, fieldKeys, fieldLabels, type Fields, type Note, type Subject } from '../lib/model';
type Props = { notes: Note[]; subject: Subject; note?: Note; onClose: () => void; onSave: (note: Note) => boolean };
export default function NoteModal({ subject, note, notes, onClose, onSave }: Props) {
 const dialog = useRef<HTMLDialogElement>(null);
 const [kind, setKind] = useState<Subject>(note?.subject || subject);
 const [title, setTitle] = useState(note?.title || '');
 const [content, setContent] = useState(note?.content || '');
 const [category, setCategory] = useState(note?.category || categories[subject][0]);
 const [answer, setAnswer] = useState(note?.answer || '');
 const [correct, setCorrect] = useState(note?.correct || '');
 const [status, setStatus] = useState<Note['status']>(note?.status || '待复习');
 const [fields, setFields] = useState<Fields>(note?.fields || {});
 const [recordType, setRecordType] = useState<'question' | 'story'>(note?.recordType || 'question');
 const [storyId, setStoryId] = useState(note?.storyId || '');
 const [sourceId, setSourceId] = useState(note?.sourceId || '');
 const [error, setError] = useState('');
 useEffect(() => { const el = dialog.current!; el.showModal(); return () => el.close(); }, []);
 const mistake = kind === 'Listening' || kind === 'Reading';
 return <dialog ref={dialog} onCancel={onClose} onClick={e => { if (e.target === dialog.current) onClose(); }} className="note-dialog"><form onSubmit={e => { e.preventDefault(); if (!title.trim() || !content.trim()) { setError('请填写标题与记录内容。'); return; } const now = new Date().toISOString(); if (onSave({ fields, recordType: kind === 'Speaking' ? recordType : undefined, storyId: kind === 'Speaking' && recordType === 'question' ? storyId || undefined : undefined, sourceId: kind === 'Vocabulary' ? sourceId || undefined : undefined, sourceTitle: kind === 'Vocabulary' ? notes.find(n => n.id === sourceId)?.title || note?.sourceTitle : undefined, id: note?.id || crypto.randomUUID(), subject: kind, title: title.trim(), content: content.trim(), category, answer, correct, status, createdAt: note?.createdAt || now, updatedAt: now })) onClose(); else setError('无法保存，请检查浏览器存储设置。'); }}>
 <div className="modal-heading"><div><span className="eyebrow">YOUR KNOWLEDGE, CAPTURED</span><h2>{note?.title ? '编辑记录' : '添加一条新记录'}</h2></div><button type="button" className="icon-button" aria-label="关闭弹窗" onClick={onClose}><X size={20}/></button></div>
 <div className="form-pair"><label>科目<select value={kind} onChange={e => { const s = e.target.value as Subject; setKind(s); setCategory(categories[s][0]); }}>{(mistake && !note ? ['Listening','Reading'] : [kind]).map(s => <option key={s}>{s}</option>)}</select></label><label>{kind === 'Vocabulary' ? '来源科目' : '分类'}<select aria-label={kind === 'Vocabulary' ? '来源科目' : '分类'} value={category} onChange={e => setCategory(e.target.value)}>{[...new Set([category,...categories[kind]])].map(c => <option key={c}>{c}</option>)}</select></label></div>
 <label>{kind === 'Vocabulary' ? '单词或短语' : mistake ? '练习 / 文章名称' : '题目 / 标题'} <span>*</span><input autoFocus required maxLength={160} placeholder={kind === 'Vocabulary' ? '例如：a significant impact' : '给这条记录一个清晰的标题'} value={title} onChange={e => setTitle(e.target.value)}/></label>
 {kind === 'Speaking' && <label>素材类型<select aria-label="素材类型" disabled={notes.some(n => !!note?.id && n.storyId === note?.id)} value={recordType} onChange={e => setRecordType(e.target.value as 'question' | 'story')}><option value="question">口语题目</option><option value="story">共享故事</option></select></label>}
 {mistake && <div className="form-pair"><label>我的答案<input value={answer} onChange={e => setAnswer(e.target.value)} placeholder="记录当时的答案"/></label><label>正确答案<input value={correct} onChange={e => setCorrect(e.target.value)} placeholder="正确答案或关键线索"/></label></div>}
 <label>{kind === 'Vocabulary' ? '词汇笔记' : mistake ? '复盘笔记' : kind === 'Writing' ? '记录摘要 / 补充笔记' : recordType === 'story' ? '个人故事素材' : '回答要点'} <span>*</span><textarea required rows={6} maxLength={10000} placeholder="记录值得留下的内容…" value={content} onChange={e => setContent(e.target.value)}/></label>
 { (kind === 'Writing' && category.startsWith('Task 1') ? ['chartType','structure','expressions'] : fieldKeys[kind]).map(key => <label key={key}>{fieldLabels[key]}<textarea rows={2} maxLength={10000} value={fields[key] || ''} onChange={e => setFields({...fields, [key]:e.target.value})}/></label>) }
 {kind === 'Writing' && !category.startsWith('Task 1') && <div className="logic-chain">{['idea','cause','example','result'].map(key => <div key={key}><small>{fieldLabels[key]}</small><p>{fields[key] || '尚未填写'}</p></div>)}</div>}
 {kind === 'Speaking' && recordType === 'question' && <label>关联共享故事<select aria-label="关联共享故事" value={storyId} onChange={e => setStoryId(e.target.value)}><option value="">不关联</option>{notes.filter(n => n.subject === 'Speaking' && n.recordType === 'story' && n.id !== note?.id).map(n => <option key={n.id} value={n.id}>{n.title}</option>)}</select>{storyId && <div className="linked-story">{notes.find(n => n.id === storyId)?.content}</div>}</label>}
 {kind === 'Speaking' && recordType === 'story' && <p className="phase-note">已关联 {notes.filter(n => n.storyId === note?.id && !!note?.id).length} 道题目。编辑故事会同步更新所有关联题目的展示。</p>}
 {kind === 'Vocabulary' && <label>关联错题<select aria-label="关联错题" value={sourceId} onChange={e => { setSourceId(e.target.value); const source = notes.find(n => n.id === e.target.value); if(source) setCategory(source.subject); }}><option value="">不关联 / 原记录已删除</option>{notes.filter(n => ['Listening','Reading'].includes(n.subject)).map(n => <option key={n.id} value={n.id}>{n.subject} · {n.title} · {n.fields?.questionNumber}</option>)}</select></label>}
 <label>复习状态<select aria-label="复习状态" value={status} onChange={e => setStatus(e.target.value as Note['status'])}><option>待复习</option><option>已掌握</option></select></label>
 {error && <p role="alert" className="error">{error}</p>}<div className="modal-footer"><span>仅保存在当前浏览器</span><button type="button" className="secondary" onClick={onClose}>取消</button><button className="primary" type="submit"><Check size={16}/>保存记录</button></div>
 </form></dialog>;
}

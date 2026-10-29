import { useState } from 'react';
import { subjects, type Note } from '../lib/model';
const KEY = 'ielts-workspace.notes.v1';
function load(): {notes: Note[]; error: string} {
 try {
  const raw = localStorage.getItem(KEY);
  if (!raw) return {notes:[],error:''};
  const data: unknown = JSON.parse(raw);
  if (!Array.isArray(data) || !data.every(n => n && typeof n.id === 'string' && typeof n.title === 'string' && typeof n.content === 'string' && subjects.includes(n.subject))) throw Error();
  const ids = new Set(data.map(n => n.id));
  if (ids.size !== data.length) throw Error();
  const normalized: Note[] = data.map(n => ({...n, fields:n.fields && typeof n.fields === 'object' ? Object.fromEntries(Object.entries(n.fields).filter(([,v]) => typeof v === 'string')) : {},category:typeof n.category === 'string' ? n.category : '',answer:typeof n.answer === 'string' ? n.answer : '',correct:typeof n.correct === 'string' ? n.correct : '',status:n.status === '已掌握' ? '已掌握' : '待复习',storyId:data.some(s => s.id === n.storyId && s.subject === 'Speaking' && s.recordType === 'story') ? n.storyId : undefined,sourceId:data.some(s => s.id === n.sourceId && ['Listening','Reading'].includes(s.subject)) ? n.sourceId : undefined}));
  return {notes:normalized,error:''};
 } catch { return {notes:[],error:'本地数据无法读取。为避免覆盖，已暂停保存；请先备份或恢复浏览器中的 ielts-workspace.notes.v1 数据后刷新。'}; }
}
export function useNotes() {
 const [initial] = useState(load);
 const [error, setError] = useState(initial.error);
 const [notes, setNotes] = useState<Note[]>(initial.notes);
 function persist(next: Note[]) { if(initial.error) return false; try { localStorage.setItem(KEY, JSON.stringify(next)); setNotes(next); setError(''); return true; } catch { setError('保存失败：浏览器存储不可用或空间不足，请保留内容后重试。'); return false; } }
 return { notes, error, save: (note: Note) => {
  // Only valid IDs may be persisted as relationships.
  if(note.storyId && !notes.some(n => n.id === note.storyId && n.recordType === 'story' && n.subject === 'Speaking')) return false;
  if(note.sourceId && !notes.some(n => n.id === note.sourceId && ['Listening','Reading'].includes(n.subject))) return false;
  if(note.recordType !== 'story' && notes.some(n => n.storyId === note.id)) return false;
  return persist([note, ...notes.filter(n => n.id !== note.id)]);
 }, remove: (id: string) => persist(notes.filter(n => n.id !== id).map(n => ({...n, storyId: n.storyId === id ? undefined : n.storyId, sourceId: n.sourceId === id ? undefined : n.sourceId}))) };
}

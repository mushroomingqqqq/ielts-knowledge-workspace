import { fieldLabels, type Note } from '../lib/model';
export default function NoteDetails({ note, notes = [] }: { note: Note; notes?: Note[] }) {
 const story = notes.find(n => n.id === note.storyId);
 return <div className="record-details">
 {note.correct && <p><b>正确答案</b>{note.correct}</p>}
 <p><b>{note.recordType === 'story' ? '故事内容' : '记录内容'}</b>{note.content}</p>
 {note.subject === 'Writing' && !note.category.startsWith('Task 1') && <div className="logic-chain" aria-label="观点逻辑链">{['idea','cause','example','result'].map((key,i) => <div key={key}><small>{i+1} · {fieldLabels[key]}</small><p>{note.fields?.[key] || '尚未填写'}</p></div>)}</div>}
 {Object.entries(note.fields || {}).filter(([,v]) => v).map(([k,v]) => <p key={k}><b>{fieldLabels[k] || k}</b>{v}</p>)}
 {story && <div className="linked-story"><b>关联故事 · {story.title}</b><p>{story.content}</p></div>}
 {note.sourceTitle && <p><b>来源错题{note.sourceId ? '' : '（原记录已删除）'}</b>{notes.find(n => n.id === note.sourceId)?.title || note.sourceTitle}</p>}
 </div>;
}

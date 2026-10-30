"""Import the supplied speaking PDF; no generated questions, translations or answers.
Usage: python3 scripts/import-speaking.py source.pdf
"""
import sys,re,json,hashlib,subprocess,pathlib,collections
pdf=pathlib.Path(sys.argv[1]);sha=hashlib.sha256(pdf.read_bytes()).hexdigest()
text=subprocess.check_output(['pdftotext','-layout',str(pdf),'-']).decode();pages=text.split('\f');pages=pages[:-1] if not pages[-1].strip() else pages
rows=[];printed={};sourcepages=[]
for p,body in enumerate(pages,1):
 match=re.findall(r'第\s*(\d+)\s*页',body);printed[p]=match[-1] if match else None
 clean=[]
 for line in body.splitlines():
  line=line.strip()
  if not line or line.startswith('2026 年 9-12 月雅思口语新题完整版') or re.fullmatch(r'第\s*\d+\s*页',line):continue
  clean.append(line)
  if p>=4:rows.append({'text':line,'page':p})
 sourcepages.append({'page':p,'printedPage':printed[p],'text':'\n'.join(clean)})
cat='必考题';topic=None;topics=[];blocks=[];block=[]
heading=re.compile(r'^(?:P\s*([12])\s*\.\s*(.+)|Part\s*2\s*&\s*3\s*(.+))$',re.I)
for row in rows:
 s=row['text']
 if re.match(r'^9-12\s*月\s*Part\s*[12]',s,re.I):
  if '保留' in s:cat='保留题'
  elif '必考' in s:cat='必考题'
  else:cat='新题'
  continue
 m=heading.match(s)
 if m:
  if topic:blocks.append((topic,block))
  part=int(m.group(1) or 2);title=(m.group(2) or m.group(3)).strip()
  topic={'id':'topic-'+hashlib.sha256((str(part)+'|'+cat+'|'+re.sub(r'\s+','',title)).encode()).hexdigest()[:14],'part':part,'category':cat,'title':title,'page':row['page'],'heading':s}
  topics.append(topic);block=[]
 else:block.append(row)
if topic:blocks.append((topic,block))
num=re.compile(r'^(?:题\s*目\s*)?(\d+)\s*[.．、)]\s*(?=[A-Za-z])')
answerMarker=re.compile(r'^(?:考官\s*答\s*案|回\s*答|参考\s*答\s*案|参考\s*范\s*文|Answer(?:\s*\([^)]*\))?)\s*[:：]',re.I)
questions=[];warnings=[]
def source(rs,label=''):
 ps=sorted(set(r['page'] for r in rs));return {'pages':ps,'printedPages':[{'page':p,'label':printed[p]} for p in ps],'label':label}
def split_bilingual(s):
 m=re.search(r'[\u3400-\u9fff]',s)
 return (s[:m.start()].rstrip(),s[m.start():]) if m else (s,'')
def numbered_parse(rs):
 groups=[];current=[]
 for r in rs:
  if num.match(r['text']):
   if current:groups.append(current)
   current=[{**r,'text':num.sub('',r['text'])}]
  elif current:current.append(r)
 if current:groups.append(current)
 return groups
def q_from_rows(topic,rs,part,parent=None,implicit=False):
 if not rs:return
 qlines=[];zh=[];ref=[];mode='question';ended=False
 for r in rs:
  s=r['text'];marker=answerMarker.match(s)
  if marker:
   mode='answer';body=s[marker.end():].strip()
   if body:ref.append({**r,'text':body})
   continue
  if mode=='answer':ref.append(r);continue
  en,cn=split_bilingual(s)
  if part==3 and ended and en and not cn:mode='answer';ref.append(r);continue
  if en:qlines.append({**r,'text':en})
  if cn:zh.append({**r,'text':cn})
  if '?' in s or '？' in s:ended=True
 en='\n'.join(r['text'] for r in qlines).strip();translation='\n'.join(r['text'] for r in zh).strip()
 if not en:return
 flags=[]
 if part==3 and not re.search(r'[?？]',en):flags.append('源文问题疑似不完整，未补写')
 if 'Politeness' in topic['title'] and 'sneakers' in en:flags.append('原资料将此鞋类问题放在礼貌话题下，保留原分组')
 q={'part':part,'topicId':topic['id'],'category':topic['category'],'english':en,'translation':translation,'cues':[],'references':([{'text':'\n'.join(r['text'] for r in ref),'source':source(ref,'原资料参考答案')}] if ref else []),'questionSource':source(qlines),'sources':[source(rs)],'parentIds':[parent] if parent else [],'flags':flags,'raw':'\n'.join(r['text'] for r in rs)}
 add(q)
def norm(s):return re.sub(r'\s+',' ',s).strip().casefold()
indexed={}
def add(q):
 signature=str(q['part'])+'|'+q['topicId']+'|'+norm(q['english'])+'|'+norm('\n'.join(q['cues']))
 qid='sp-'+hashlib.sha256(signature.encode()).hexdigest()[:18]
 q['id']=qid
 if qid in indexed:
  old=indexed[qid];old['sources']+=q['sources'];old['parentIds']=sorted(set(old['parentIds']+q['parentIds']))
  for ref in q['references']:
   identical=next((r for r in old['references'] if norm(r['text'])==norm(ref['text'])),None)
   if identical:identical['source']['pages']=sorted(set(identical['source']['pages']+ref['source']['pages']));identical['source']['printedPages']=[{'page':p,'label':printed[p]} for p in identical['source']['pages']]
   else:old['references'].append(ref)
 else:indexed[qid]=q;questions.append(q)
 return qid
for topic,rs in blocks:
 if topic['part']==1:
  # Section labels separate pure-question and answer editions; do not pair by ordinal.
  chunks=[];chunk=[]
  for r in rs:
   if re.match(r'^(?:纯题目|答案版)',r['text']):
    if chunk:chunks.append(chunk)
    chunk=[]
   elif r['text'].startswith(('题库中','万能老题','保留题库','保留题部分')):continue
   else:chunk.append(r)
  if chunk:chunks.append(chunk)
  for chunk in chunks:
   for group in numbered_parse(chunk):q_from_rows(topic,group,1)
 else:
  phase='prompt';prompt=[];cues=[];refs=[];p3=[];raw=[];implicit=False
  for r in rs:
   s=r['text'];raw.append(r)
   if re.match(r'^Part\s*3(?:\s|$|[:：])',s,re.I):phase='p3';continue
   if phase=='p3':p3.append(r);continue
   if re.match(r'^Part\s*2(?:\s|$|[:：])',s,re.I):continue
   am=answerMarker.match(s)
   if am:
    phase='answer';body=s[am.end():].strip()
    if body:refs.append({**r,'text':body})
    continue
   if phase=='answer':refs.append(r);continue
   ins=re.search(r'You should say\s*[:：]?|Some instructions (?:that )?you can follow\s*[:：]?|Tips\s*:',s,re.I)
   if ins:
    if ins.start():prompt.append({**r,'text':s[:ins.start()].rstrip()})
    phase='cues';continue
   if phase=='cues' and re.search(r'[?？]',s):phase='p3';implicit=True;p3.append(r);continue
   if phase=='prompt' and 'Where you have been that was crowded' in s:
    i=s.index('Where you have been that was crowded');prompt.append({**r,'text':s[:i].rstrip()});cues.append({**r,'text':s[i:]});phase='cues';continue
   if phase=='prompt' and not prompt and not re.match(r'[A-Za-z]',s):continue
   (cues if phase=='cues' else prompt).append(r)
  en='\n'.join(r['text'] for r in prompt);english,translation=split_bilingual(en)
  q={'part':2,'topicId':topic['id'],'category':topic['category'],'english':english,'translation':translation,'cues':[r['text'] for r in cues],'references':([{'text':'\n'.join(r['text'] for r in refs),'source':source(refs,'原资料参考答案')}] if refs else []),'questionSource':source(prompt+cues),'sources':[source(raw)],'parentIds':[],'flags':(['Part 3 起始标记缺失或位于首批延伸问题之后；按原文问题边界整理'] if implicit else []),'raw':'\n'.join(r['text'] for r in raw)}
  parent=add(q)
  child_topic={**topic,'part':3}
  if any(num.match(r['text']) for r in p3):
   groups=numbered_parse(p3)
  else:
   groups=[];group=[]
   for r in p3:
    group.append(r)
    if re.search(r'[?？]',r['text']):groups.append(group);group=[]
   if group:groups.append(group)
  for group in groups:q_from_rows(child_topic,group,3,parent)
# Remove umbrella without questions but keep original heading in source pages.
used={q['topicId'] for q in questions};topics=list({t['id']:t for t in topics if t['id'] in used}.values())
counts={str(p):sum(q['part']==p for q in questions) for p in [1,2,3]}
bank={'version':hashlib.sha256((sha+'|speaking-import-v1.0').encode()).hexdigest(),'schemaVersion':1,'source':{'filename':pdf.name,'sha256':sha,'pageCount':len(pages),'title':'2026年9–12月雅思口语题库完整版 · 20260916','notice':'用户提供的备考资料；不对原文命中率、参考答案分数或事实准确性作认证。'},'topics':topics,'questions':questions,'pages':sourcepages,'counts':counts,'warnings':['物理页码与文件印刷页码不一致，以物理页码定位。','原文缺失的译文和参考答案保持空白；不同问法未按题号强行配对。','原文拼写、语法及疑似截断内容照录，使用时请结合原页核对。']}
pathlib.Path('public/speaking').mkdir(parents=True,exist_ok=True);pathlib.Path('public/speaking/bank.json').write_text(json.dumps(bank,ensure_ascii=False,indent=2))
print(json.dumps({'source_sha256':sha,'pages':len(pages),'topics':len(topics),'questions':len(questions),'counts':counts,'with_reference':sum(bool(q['references']) for q in questions),'with_translation':sum(bool(q['translation']) for q in questions),'flags':[(q['english'],q['flags']) for q in questions if q['flags']]},ensure_ascii=False))

"""Private local import. Usage: python3 scripts/import-writing-materials.py logic.pdf frameworks.pdf english.pdf"""
import sys, subprocess, re, json, hashlib, pathlib
names=['论点库1','T2 四大题型框架','浓缩版观点库']
result=[]
seen={}
for kind,path,name in zip(['logic','structure','english'],sys.argv[1:],names):
 text=subprocess.check_output(['pdftotext','-layout',path,'-']).decode()
 started=False
 for page,body in enumerate(text.split('\f'),1):
  # Skip the main library's table of contents. Keep provenance by physical PDF page.
  if kind=='logic':
   if re.search(r'话题\s*1[:：]\s*政府类：政府职能\s*\n',body): started=True
   if not started: continue
  body=re.sub(r'每天一定要刷一个话题，反复看，反复刷|\s*-\s*\d+\s*-\s*$', '',body).strip()
  if kind=='logic':
   body='\n'.join(l.strip() for l in body.splitlines() if re.match(r'^\s*(?:[\u4e00-\u9fff]|[ABC]\s*[\u4e00-\u9fff]|[：:（(])',l))
  for start in range(0,len(body),1400):
   chunk=body[start:start+1600].strip()
   if len(chunk)<20:continue
   key=re.sub(r'\W','',chunk).lower()
   if key in seen:
    seen[key]['sources'].append({'name':name,'page':page});continue
   row={'id':hashlib.sha256(key.encode()).hexdigest()[:16],'kind':kind,'text':chunk,'sources':[{'name':name,'page':page}]}
   seen[key]=row;result.append(row)
# Diagram-only content transcribed after visually inspecting PDF pages 1–2.
result.append({'id':'structure-diagrams','kind':'structure','text':'同意/利弊：开头介绍题目并表态，BP1、BP2 支持理由，BP3 可让步回应，结尾总结。双方：开头介绍双方及个人立场，BP1 讨论 A，BP2 讨论 B，BP3 个人评价，结尾可选。双问题：开头改写并回答两问，BP1 回答第一问，BP2 回答第二问，结尾总结。','sources':[{'name':'T2 四大题型框架','page':1},{'name':'T2 四大题型框架','page':2}]})
pathlib.Path('server/private').mkdir(exist_ok=True)
pathlib.Path('server/private/materials.json').write_text(json.dumps(result,ensure_ascii=False))
print('Imported private reference chunks:',len(result),'(exact duplicates merged; semantic overlaps merged at retrieval/feedback, never counted as separate ideas)')

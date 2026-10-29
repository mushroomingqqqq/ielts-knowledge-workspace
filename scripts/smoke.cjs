// Run with PLAYWRIGHT_MODULE=/path/to/playwright node scripts/smoke.cjs.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
(async () => {
 const b = await chromium.launch({executablePath:process.env.CHROMIUM_PATH || '/usr/bin/chromium',args:['--no-sandbox']});
 try {
 const p = await b.newPage({viewport:{width:1440,height:1000}});
 const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.APP_URL || 'http://127.0.0.1:5173');
 const data = () => p.evaluate(() => JSON.parse(localStorage.getItem('ielts-workspace.notes.v1')));
 const nav = async name => {await p.locator('nav').getByRole('button',{name,exact:true}).click();};
 const add = async () => p.getByRole('button',{name:'添加记录',exact:true}).click();
 const fill = async (label,value) => p.locator('dialog').getByLabel(label,{exact:false}).fill(value);
 const save = async () => {await p.locator('dialog').getByRole('button',{name:'保存记录'}).click();await p.locator('dialog').waitFor({state:'detached'});};
 await nav('Listening');await add();await fill('练习 / 文章名称','Practice A');await fill('复盘笔记','听漏了复数');await fill('题号','12');await fill('题型','填空题');await fill('我的答案','book');await fill('正确答案','books');await fill('听力原文','Bring your books');await fill('错误原因','拼写');await fill('同义替换','bring / take');await fill('生词','reference');await save();
 let notes=await data();assert.equal(notes[0].fields.questionNumber,'12');assert.equal(notes[0].correct,'books');
 await p.getByRole('button',{name:/Practice A.*Q12/}).click();await p.getByRole('button',{name:'添加到词汇库'}).click();await fill('单词或短语','reference');await fill('词汇笔记','来自错题');await fill('中文释义','参考资料');await fill('英文例句','Use this reference.');await save();
 notes=await data();const source=notes.find(n=>n.subject==='Listening');assert.equal(notes[0].sourceId,source.id);console.log('PASS Listening fields + linked vocabulary');
 await nav('Reading');for (const [number,reason] of [['1','定位错误'],['2','逻辑误判']]) {await add();await fill('练习 / 文章名称','Article A');await fill('复盘笔记','复盘');await fill('题号',number);await fill('题型','判断题');await fill('题目内容','The statement');await fill('原文定位句','Evidence sentence');await fill('错误原因',reason);await save();}
 await p.getByLabel('筛选错误原因',{exact:true}).selectOption('逻辑误判');assert.equal(await p.locator('.record-card').count(),1);await p.getByLabel('筛选文章',{exact:true}).selectOption('Article A');assert.equal(await p.locator('.article-heading').count(),1);console.log('PASS Reading article grouping + reason filter');
 await nav('Writing');await add();await fill('题目 / 标题','Education');await fill('记录摘要','Outline');for(const [l,v] of [['话题','Education'],['立场','Agree'],['观点','Access'],['原因','Lower costs'],['例子','Online courses'],['结果','More opportunities'],['完整英文句子','Education creates opportunities.']]) await fill(l,v);await save();await p.getByRole('button',{name:/Education.*待复习/}).click();assert.equal(await p.locator('.logic-chain>div').count(),4);await add();await p.locator('dialog').getByLabel('分类',{exact:true}).selectOption('Task 1 · 图表');await fill('题目 / 标题','Chart');await fill('记录摘要','Chart notes');await fill('图表类型','折线图');await fill('写作结构','Overview / details');await save();console.log('PASS Writing Task 1 / Task 2 + visual chain');
 await nav('Speaking');await add();await p.getByLabel('素材类型',{exact:true}).selectOption('story');await fill('题目 / 标题','Shared trip');await fill('个人故事素材','Original story');await save();notes=await data();const story=notes.find(n=>n.recordType==='story');
 for(const [part,title] of [['Part 1','Travel'],['Part 2','A journey'],['Part 3','Tourism']]) {await add();await p.locator('dialog').getByLabel('分类',{exact:true}).selectOption(part);await fill('题目 / 标题',title);await fill('回答要点','Travel notes');await p.getByLabel('关联共享故事',{exact:true}).selectOption(story.id);await save();}
 await p.getByLabel('编辑 Shared trip',{exact:true}).click();await fill('个人故事素材','Updated story');await save();await p.reload();await p.getByRole('button',{name:/A journey.*Part 2/}).click();await p.getByText('Updated story',{exact:true}).waitFor();notes=await data();assert.equal(notes.filter(n=>n.storyId===story.id).length,3);console.log('PASS shared story linked across all parts + edit + reload');
 await p.getByLabel('删除 Shared trip',{exact:true}).click();await p.getByRole('button',{name:'确认删除'}).click();notes=await data();assert.equal(notes.filter(n=>n.storyId===story.id).length,0);assert.equal(notes.filter(n=>n.subject==='Speaking').length,3);
 await nav('Listening');await p.getByLabel('删除 Practice A',{exact:true}).click();await p.getByRole('button',{name:'确认删除'}).click();notes=await data();assert.equal(notes.find(n=>n.subject==='Vocabulary').sourceId,undefined);assert.equal(notes.find(n=>n.subject==='Vocabulary').sourceTitle,'Practice A');console.log('PASS deletions preserve dependent records and clear links');
 await nav('Review');await p.getByRole('button',{name:'翻开记录'}).click();await p.getByRole('button',{name:'我已掌握'}).click();await p.getByLabel('复习列表状态').selectOption('已掌握');await p.getByRole('button',{name:'翻开记录'}).click();await p.getByRole('button',{name:'待复习',exact:true}).click();assert.equal((await data()).filter(n=>n.status==='已掌握').length,0);console.log('PASS review both status transitions');
 await p.reload();assert.equal((await data()).length,8);assert.deepEqual(errors,[]);
 // A separate context validates first-stage schema without changing live user data.
 const legacy=await b.newPage();await legacy.goto('http://127.0.0.1:5173');await legacy.evaluate(()=>localStorage.setItem('ielts-workspace.notes.v1',JSON.stringify([{id:'legacy',subject:'Vocabulary',title:'legacy word',content:'legacy content',category:'Reading',answer:'',correct:'',status:'待复习',createdAt:'2026-01-01',updatedAt:'2026-01-01'}])));await legacy.reload();await legacy.getByText('legacy word',{exact:false}).waitFor();assert.equal(await legacy.locator('.error').count(),0);console.log('PASS legacy data compatibility + no runtime errors');
 } finally {await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});

export const subjects = ['Listening', 'Reading', 'Writing', 'Speaking', 'Vocabulary'] as const;
export type Subject = typeof subjects[number];
export type Note = { articleId?: string; originArticleId?: string; originArticleTitle?: string; fields?: Fields; storyId?: string; sourceId?: string; sourceTitle?: string; recordType?: 'question' | 'story'; id: string; subject: Subject; title: string; content: string; category: string; answer: string; correct: string; status: '待复习' | '已掌握'; createdAt: string; updatedAt: string };
export const categories: Record<Subject, string[]> = { Listening: ['Section 1', 'Section 2', 'Section 3', 'Section 4'], Reading: ['填空题', '判断题', '匹配题', '选择题'], Writing: ['Task 2 · Education', 'Task 2 · Technology', 'Task 2 · Environment', 'Task 2 · Society', 'Task 1 · 图表'], Speaking: ['Part 1', 'Part 2', 'Part 3'], Vocabulary: ['Listening', 'Reading', 'Writing', 'Speaking'] };
export const descriptions: Record<Subject, string> = { Listening: '留住每一次听懂的线索', Reading: '让每一次错题都有迹可循', Writing: '收集观点，让表达更有逻辑', Speaking: '把你的经历，变成表达素材', Vocabulary: '在语境里积累，在复习中掌握' };

export type Fields = Record<string, string>;
export const fieldLabels: Record<string, string> = {
 questionNumber:'题号', questionType:'题型', transcript:'听力原文', reason:'错误原因', synonyms:'同义替换', newWords:'生词', question:'题目内容', evidence:'原文定位句', topic:'话题', stance:'立场', idea:'观点', cause:'原因', example:'例子', result:'结果', sentence:'完整英文句子', expressions:'常用表达', chartType:'图表类型', structure:'写作结构', keywords:'关键词', relatedTopics:'关联话题', meaning:'中文释义', exampleSentence:'英文例句', collocations:'常用搭配', translation:'中文翻译', correspondence:'题干与原文对应关系', paragraph:'原文段落位置'
};
export const fieldKeys: Record<Subject, string[]> = {
 Listening:['questionNumber','questionType','transcript','reason','synonyms','newWords'],
 Reading:['questionNumber','questionType','question','evidence','translation','correspondence','paragraph','synonyms','reason'],
 Writing:['topic','stance','idea','cause','example','result','sentence','expressions'],
 Speaking:['topic','keywords','expressions','relatedTopics'],
 Vocabulary:['meaning','collocations','exampleSentence','synonyms']
};

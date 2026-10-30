// Original practice questions adapted from the uploaded library's topic headings.
// Not claimed as past IELTS exam questions, and contain no arguments or model answers.
export const practicePrompts=[
 ['政府职能与犯罪','Some people think that longer prison sentences are the best way to reduce crime. Others believe education and training are more effective. Discuss both views and give your own opinion.',2],
 ['教育','Some people believe schools should focus on practical skills rather than academic knowledge. To what extent do you agree or disagree?',6],
 ['文化艺术','Some people think governments should fund the arts, while others believe this money should be spent on public services. Discuss both views and give your own opinion.',11],
 ['科技','Technology is increasingly used to carry out tasks previously done by people. Do the advantages of this development outweigh the disadvantages?',15],
 ['城市','Many large cities suffer from traffic congestion. What are the causes of this problem, and what measures could be taken to address it?',18],
 ['生活价值观与生活方式','Some people believe career success is more important than spending time with family. To what extent do you agree or disagree?',24],
 ['环境','The demand for energy continues to rise. What problems does this cause, and what measures could be taken to address them?',32],
 ['媒体','Advertising has a growing influence on what people buy. Is this a positive or negative development?',37],
 ['全球化','International tourism has become increasingly common. Do its advantages outweigh its disadvantages?',44]
].map(([topic,text,chapter])=>({id:'library-practice-'+chapter,topic,text,source:'改编练习题 · 主题参考《论点库1》话题 '+chapter+'（非历年真题）'}));

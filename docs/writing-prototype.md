> 本文记录首版原型；当前七步流程及 AI 接入状态以 [writing-ai.md](writing-ai.md) 为准。

# Writing：交互原型与关联规划

## 本轮已实现

- Task 1：Data Charts（动态/静态）、Process、Maps 三类入口；模板展开、中英完整句、关键词笔记、单句练习、真实 SVG 教学示意图、信息分析、四段写作、人工修改记录。只有少量明确标注的通用示例，不是完整课程或真题库。
- Task 2：题目 → 中文初稿 → 反馈区 → 修改中文 → 英文框架 → 可选完整作文。中文逻辑未自行确认时不能进入英文。修改中文后需要重新确认。
- 九类个人话题池入口，用户添加题目后才可随机抽取，存在其他话题时避开上一份 Task 2 的话题。未导入《论点库1》，不会生成私人观点。仅保留一条明确 DEMO 题目作为流程示例。
- 草稿逐次写入本地，显式快照保留阶段与全部字段，初稿、修改稿及英文修改分别保存。
- Writing Archive 可恢复训练；Sentence Bank / Writing Mistakes 可手动添加与删除、返回来源训练。删除训练需要确认，并清理所属条目。
- 旧 Writing Note 原封保留于「已有写作笔记」，不迁移或猜测其训练阶段。

## AI 能力边界

**没有接入 AI API，没有执行任何逻辑、语法或搭配分析。** 两个反馈阶段明确展示待接入状态，请求按钮禁用。当前填写的反馈属于自查或人工反馈；逻辑确认是用户自己的确认，不代表 AI 审核通过。后续接口须保存 provider、request ID、反馈时间、输入版本和反馈来源，不得把固定清单伪装成分析结果。

## 数据

同一个 `ielts-workspace.data.v2` Workspace 新增可选 `writing`，不改 Reading、Mapping、Discovery、Review 数据。

- `WritingPrompt`：稳定 ID、用户题目、话题。
- `WritingSession`：稳定 ID、Task、类别、原题、当前阶段、草稿字段、版本快照、创建/更新时间。
- `WritingEntry`：稳定 ID、来源 sessionId、sentence / mistake 类型、内容和时间。
- 初稿与修改稿分别保存（`intro` / `rev_intro` 等）；英文初稿与修改分开，作文可为空。AI 反馈结构留待接口阶段实现。
- 每次写入统一 Workspace 后才更新界面，读取损坏 writing 数据时暂停写入。

## 后续关联规划（尚未实现）

1. Sentence Bank 可扩展为独立完整句实体，外键指向训练 ID、版本 ID 和具体字段；允许关联 Vocabulary ID，不复制词汇。
2. Writing Mistakes 扩展 original / revision / reason / status，关联训练与版本；以后再接入统一 Mistakes 和 Review。当前全局 Mistakes 仍只统计听力/阅读，未假装已跨模块同步。
3. Reading 的真实表达可通过人工选择导入 Sentence Bank，保留 Mapping ID / Article ID；不把题干对应自动当成可复用写作句。
4. 原 Home 写作卡片仍统计旧素材 Note，Writing 训练统计单独标明训练记录；后续确认信息架构后再统一指标。

## 验证

`npx tsc --noEmit`、`npm run build`。

开发服务器运行后，可使用独立 Playwright / Chromium 执行：

```sh
PLAYWRIGHT_MODULE=/path/to/playwright node scripts/writing-smoke.cjs
```

截图由独立浏览器上下文生成，DEMO 中文框架仅由测试脚本填写，不作为应用默认观点或用户历史。

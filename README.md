# IELTS Knowledge Workspace

面向雅思考生的个人学习资料库。当前为第二阶段可交互桌面端原型，参考奶油白与鼠尾草绿 SaaS Dashboard 视觉，不含真题库、分数预测或 AI API。

## 启动

需要 Node.js 22.12+（本环境使用 Node.js 24）和 npm。

```sh
npm ci
npm run dev
```

开发端口默认为 5173。生产构建与本地预览：

```sh
npm run build
npm run preview
```

## 第一阶段功能

- Dashboard：四科入口、Quick Add、真实记录统计、待复习入口、最近记录与搜索。
- 七个导航页面，URL hash 支持刷新定位与浏览器前进后退。
- 记录表单：通用笔记与状态，外加各科结构化字段（见第二阶段说明）。
- 新增、编辑、删除确认、分类筛选、必填验证、保存反馈。
- 词汇与错题的基础翻卡复习，支持标记掌握。
- 数据保存在当前浏览器 localStorage，不添加演示数据，也不使用私人学习记录。

## 文件结构

```text
src/
  App.tsx                  页面、导航和 Dashboard
  components/NoteModal.tsx  通用基础录入表单
  hooks/useNotes.ts         本地存储适配层
  lib/model.ts             类型、科目与分类
  styles.css               全局视觉与布局
  main.tsx                 React 入口
vite.config.ts             Vite / React / Tailwind 配置
```

## 数据与边界

当前统一资料的 localStorage key 为 `ielts-workspace.data.v2`，旧 `ielts-workspace.notes.v1` 保留作为迁移备份。所有统计来自真实记录；待复习只包含标记为「待复习」的听力、阅读与词汇。标记为「已掌握」后可在原记录编辑恢复待复习。

数据仅在当前浏览器、当前站点保存，不跨设备同步。清除站点数据会删除记录；当前版本尚无导入导出和账号。开发与生产预览端口不同，浏览器会将其作为不同站点存储。请勿将本地存储视为长期备份。

## 第二阶段（当前版本）

在保留原 Dashboard 和组件目录的基础上扩展：

- Listening：练习名称、Section、题号、题型、双答案、听力原文、错因、同义替换、生词及状态。
- Reading：以文章名称分组，独立记录每道题，按文章、题型、错因、状态组合筛选。
- Writing：Task 1 图表类型 / 结构 / 表达；Task 2 话题、立场、观点、原因、例子、结果、完整句。录入与详情中实时显示「观点 → 原因 → 例子 → 结果」逻辑链。
- Speaking：选择「口语题目」或「共享故事」创建素材。题目选择共享故事即可跨 Part 关联；故事编辑后关联题目展示最新内容。已有题目引用的故事不能直接改为题目。
- Vocabulary：错题详情点击「添加到词汇库」，自动带入来源 ID、同义替换和原文例句；补充词汇、释义后保存，也可手动关联错题。
- Review：整合听力、阅读和词汇；切换待复习 / 已掌握列表，翻卡并双向更新掌握状态。各科详情也可更改状态。
- 旧版记录仍使用原存储 key，原始文本保留在笔记区，新增字段为空，不会自动猜测或拆分旧内容。

关系存储在记录的 `storyId` 和 `sourceId`，不依赖标题。删除故事会解除关联但保留题目；删除错题会解除词汇关联但保留词汇与来源名称。关联清理与删除在一次 localStorage 写入中完成。读取异常时阻止保存，避免覆盖原始数据。

新增文件：`components/Library.tsx`（分组、筛选及详情）、`components/NoteDetails.tsx`（结构化详情和逻辑链）。

### 验证

```sh
npx tsc --noEmit
npm run build
```

`scripts/smoke.cjs` 提供真实 Chromium 冒烟检查，覆盖结构化字段、文章筛选、逻辑链、共享故事多题关联、删除清理、复习状态以及旧数据兼容。仅在独立测试浏览器上下文生成临时数据。工具不属于应用运行依赖；需自行提供 Playwright 与 Chromium：

```sh
# 在开发服务器启动后运行，可按机器设置路径
PLAYWRIGHT_MODULE=/path/to/playwright CHROMIUM_PATH=/path/to/chromium node scripts/smoke.cjs
```

当前仍不含账号、云端同步、自动复习调度、导入导出；没有接入 AI API。

## GitHub Pages 部署

Vite base 为 `/ielts-knowledge-workspace/`。推送到 `main` 后，`.github/workflows/deploy.yml` 使用 Node.js 24、`npm ci`、TypeScript 检查和生产构建，将 `dist` 部署到 GitHub Pages。

首次部署：

1. 确认 GitHub 仓库为 Public（Settings → General → Danger Zone → Change repository visibility）。
2. Settings → Pages → Build and deployment → Source 选择 **GitHub Actions**。
3. Actions → Deploy to GitHub Pages → Run workflow → main → Run workflow。
4. 等待 build、deploy 均成功，再访问 https://mushroomingqqqq.github.io/ielts-knowledge-workspace/ 。

应用使用 hash 导航，例如 `/ielts-knowledge-workspace/#Reading`，刷新不会请求不存在的服务器子路由，不需要 404 重定向。GitHub Pages 上的 localStorage 与本地开发站点独立，初次访问为空数据是正常现象。

## 首页视觉迭代：IELTS Knowledge Base

当前首页按像素手账档案风参考图迭代，采用本地 Silkscreen 字体、紫色棋盘格、奶油纸张和浅绿内容区。`Home.tsx` 负责 Hero、日历、四科入口、Today、词汇摘要、最近错题和复习打卡；`PixelArt.tsx` 集中定义固定 SVG 像素插画，豚鼠仅出现在 Hero。视觉覆盖样式独立放在 `src/scrapbook.css`，原有记录组件与数据格式保留。

- 四科进度显示「已掌握 / 已记录」，无记录时显示 0/0，不放入虚构学习数据。
- Today 为四个可勾选的每日计划；打卡为手动操作，独立于错题掌握状态。
- 每日计划和打卡使用 `ielts-workspace.journal.v1` 保存，原有笔记存储 key 不变。
- Mistakes 汇总听力、阅读错题并可按科目筛选；Archive 展示已掌握的历史记录，不会移动或删除原始记录。
- 导航中 Home 仍使用 `#Dashboard`，保留已有链接兼容性。


## Reading 文章档案与 Synonym System

当前已实现文章档案列表与详情、独立替换索引、词汇多对多语境关联和双向 Synonym Review。沿用 Home 的纸张卡片、像素标题和复古正文字体，未重新设计 Home。

- 左侧 Reading → 新增文章 → 新增错题 → 添加替换。文章支持日期、正确/总题数、准确率、题型与复习状态。
- Mapping 编辑中明确选择六种关系类型，可关联多个现有词汇，也可保留为独立替换。
- Vocabulary 展开记录后管理多条替换关联，点击语境回到原文和题目。
- Review → Synonym Review：双向随机/单向回忆、自评提交、加权抽查、掌握状态及回答历史。
- 原始笔记无损迁移；旧的自由文本不会被自动当成结构化同义替换。

数据关系、删除策略、迁移行为和测试方法见 [Reading 数据设计](docs/reading-data.md)。


## Reading / Synonym Review 第二轮完善

- 替换补齐完整原句和语境解释；人工确认跨文章关系网络，明确区分语境近义、词形变化和句子改写。
- 双向卡片先回忆后揭晓；当前卡片、输入、揭晓状态和提交结果可在刷新后恢复。
- 文章成绩与错题录入进度分别标注；两页共用同范围的替换统计。DEMO 可单独筛选，不混入真实关系网络。
- 共享标题区、统计条、标签、工具栏和样式变量；保留 Home 的设计。

第二轮完整数据/界面约定及测试方法见 [Reading 数据设计](docs/reading-data.md#第二轮跨文章网络与持久化回忆会话)。

## Reading 自主识别流程

文章详情默认先展示全文与逐题自主练习；答案资料和同义替换总结需主动展开。可鼠标选字建立多组对应，使用分级提示，恢复标注和草稿，并在结束后查看按实际操作生成的学习报告。

只有显式勾选的「标准参照」用于文本/位置核对；没有标准时保存待核对关系，不擅自判对错。普通旧笔记不会自动变成标准。人工确认后复用现有 Synonym Index、词汇、关系网络与双向 Review。

完整说明、数据边界、删除规则和修改文件列表见 [自主识别学习流程](docs/discovery-learning.md)。

### Writing · OpenAI 陪练接入

新增七步中文逻辑 → 英文框架训练、BYOK 会话式 OpenAI 接入与 Task 1 分步模板练习。用户在 AI Settings 提交自己的密钥，后端不读取网站所有者密钥。未用真实账户进行计费验收，不展示预设分析。私人 PDF 不进入公开仓库或前端构建。

配置、资料重新导入和 GitHub Pages 的后端限制见 [Writing AI 接入](docs/writing-ai.md)。

### 当前 Writing 训练

Writing 支持无需自动反馈服务的完整七步训练与人工核对、逐版本确认、自动保存、历史版本、确认后收录表达和个人错误、复习状态。Task 1 动 / 静态图分别使用上传讲义的原句与题图，支持填空、替换、造句和独立写作。原题池要求出处及本人核对，不把改编题作为真题。

本轮资料范围、数据兼容和测试见 [Writing 训练说明](docs/writing-training.md)。完整急救模板未在当前附件中找到，流程与地图题支持录入自己的原文模板和题图。

### BYOK 与独立 Preview

AI Settings 支持服务端临时会话、用户自带 Key、模型选择、连接测试、替换与清除。Writing 检查只使用当前用户配置。完整 Node 24 + Docker / Render 预览部署见 [Preview BYOK](docs/preview-byok.md)；资料复查见 [material-audit.md](docs/material-audit.md)。本轮仅面向独立 Preview 分支，不覆盖 main 或正式 Pages。

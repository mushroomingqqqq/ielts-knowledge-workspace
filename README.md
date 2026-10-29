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

localStorage key 为 `ielts-workspace.notes.v1`。所有统计来自真实记录；待复习只包含标记为「待复习」的听力、阅读与词汇。标记为「已掌握」后可在原记录编辑恢复待复习。

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

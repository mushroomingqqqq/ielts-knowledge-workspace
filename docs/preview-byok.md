# 独立 Preview 与 BYOK

## 本轮可运行形态

React/Vite 生产构建 + 一个 Node 24 服务同源提供静态网站与 `/api/ai`、`/api/writing`。入口为 `/ielts-knowledge-workspace/`，React hash 导航支持 Reading / Writing / AI Settings 刷新直达。`Dockerfile` 与 `render.yaml` 用于创建全新的 Render 预览服务；不覆盖 GitHub Pages，不自动部署 main。

所有模型请求只能使用当前浏览器在 AI Settings 提交的密钥，**不会读取 `OPENAI_API_KEY` 或网站所有者密钥**。不需要在 Render 配置 OpenAI Secret。

## 在 Render 发布独立预览

代码推送到独立 Preview 分支后，用 Render 账户关联该仓库，并从 **该分支** 建立新的 Docker Web Service，或用同分支的 `render.yaml` 创建 Blueprint。如果旧仓库只有 main 上的老版本，不能用旧 main 代替本次预览。

- Name: `ielts-knowledge-preview`（按需添加唯一后缀）
- Runtime: Docker；Dockerfile: `./Dockerfile`
- Instance: Free（闲置休眠后，首次访问需等待启动）
- `NODE_ENV=production`、`COOKIE_SECURE=true`
- Render 提供 `PORT` 与 `RENDER_EXTERNAL_URL`，服务自动使用后者验证同源请求；其他平台需设置 `APP_ORIGIN=https://你的预览域名`。
- Health Check: `/ielts-knowledge-workspace/`
- Auto Deploy: Off

Render 服务创建且部署成功后，实际预览地址为其面板显示的 HTTPS 域名加 `/ielts-knowledge-workspace/`。**服务尚未创建时，不应把猜测的 onrender.com 域名当作已部署链接。**

当前环境没有可用的 Render 授权连接或 Render 部署凭据，且尚未允许 `api.render.com` 的出站访问。若希望由 Codex 完成 API 部署，需要通过环境 Secret 提供 Render 部署令牌（不是 OpenAI 密钥），并允许访问 Render API 以及最终预览域名。也可以由用户在 Render 界面关联 GitHub，选择已推送 Preview 分支后点击部署。不要在聊天中粘贴密钥。

## 密钥生命周期

- API Key 输入为临时密码框，只在一次 HTTPS 提交中传输至后端，提交时清空输入状态。浏览器代码不内置密钥，不把密钥保存到 LocalStorage / SessionStorage / IndexedDB / 训练记录。
- 服务端仅在进程内存中的独立会话保存；不写磁盘、Git、日志或数据库；不提供读取密钥的 API，也不返回密钥尾号。
- Cookie 为随机、不含密钥的会话 ID；生产下使用 `__Host-` + `Secure` + `HttpOnly` + `SameSite=Strict` + `Path=/`。
- 闲置 30 分钟或最长 8 小时过期；定时回收内存；服务重启 / Render 休眠后密钥丢失，需要重新填写。
- 同源校验、CSRF nonce、固定服务商地址、防止任意 URL 代理；不允许浏览器跨站调用。
- 模型请求按会话限并发，返回固定错误信息，不透传可能含密钥的上游错误。
- 更换 / 清除密钥会取消该配置进行中的请求，旧配置结果不再返回。另一个浏览器不受影响。
- 测试连接只 GET 所选模型元数据，不生成文本。它不保证账户余额、请求速率或生成任务永远可用。
- API 额度与费用属于用户填写密钥对应的账户；没有配置时不能调用模型，仍可使用完整人工核对训练。

首次预览面向体验，不提供永久密钥托管或账号系统。多实例需要共享安全会话存储；当前免费单实例服务重启会清空会话。

## 私人学习资料

原始 PDF 与服务端 `server/private` 不进入 Git 或容器构建。当前在线体验保留已开发的页面、动静态讲义摘录和图像、个人题目录入及训练流程；若需要后端检索三份私人资料，还需在 Render 单独通过私有文件挂载导入 `server/private/materials.json`。服务会如实返回资料是否可用，不冒充已经引用未部署的私人文件。

缺少《大小作文急救模板》和可核验 Task 2 完整原题的复查结论见 [material-audit.md](material-audit.md)。不会为预览伪造这些内容。

## 验证

`npm run test:byok` 检查隔离、过期、清除、CSRF、Owner Key 不回退；`npm run test:writing:ai` 检查内容契约；`npm run test:writing:browser` 检查离线训练。BYOK 浏览器测试使用明确的本地测试传输，不声称真的调用过 OpenAI，不消耗模型额度。

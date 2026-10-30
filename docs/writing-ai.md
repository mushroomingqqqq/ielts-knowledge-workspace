# Writing AI：当前为 BYOK

旧版共享服务端密钥接入已移除。服务端不读取网站所有者 `OPENAI_API_KEY`，请勿配置共享密钥。

用户在独立 AI Settings 页面提交自己的 Key、选择模型、测试并管理临时会话。Writing 中文逻辑、英文框架与可选全文检查使用当前用户配置，真实返回结果保存在当前训练历史；缺配置或调用失败不产生模拟反馈。

服务与前端本地启动：分别运行 `npm run ai:server`、`npm run dev`。公网预览必须通过 HTTPS，以安全 Cookie 保存不含密钥的随机会话标识。

完整部署、生命周期和测试说明见 [preview-byok.md](preview-byok.md)，资料复查见 [material-audit.md](material-audit.md)。

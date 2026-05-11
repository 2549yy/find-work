# 不想流离失所

一个 Prompt 驱动的个人求职工作台，用来解读 JD、描述岗位日常，并根据目标 JD 优化简历文案。

## 功能

- 输入 JD，生成「这个 JD 到底在说什么」
- 输入 JD，生成「这个岗位典型的一天」
- 输入 JD + 简历，生成「针对岗位的简历优化文案」
- 配置 3 个 Prompt，并严格按照已保存 Prompt 生成结果
- 校验必要变量：`{{JD_TEXT}}`、`{{RESUME_TEXT}}`
- 使用浏览器本地存储保存 Prompt 和历史记录
- 发布后通过 Serverless 接口调用模型，避免在前端暴露 API Key
- 一个统一生成接口支持多个 OpenAI-compatible 模型服务商

## 发布方式

这是一个静态前端 + Serverless 生成接口的网站。

### Vercel 推荐

1. 把本目录推送到 GitHub 仓库。
2. 打开 Vercel，New Project，导入仓库。
3. Framework Preset 选择 `Other`。
4. Build Command 留空。
5. Output Directory 填 `.`。
6. 在 Environment Variables 添加你要使用的模型服务商密钥：

```text
OPENAI_API_KEY=你的 API Key
```

也可以按需添加：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DASHSCOPE_API_KEY=你的通义千问 DashScope API Key
MOONSHOT_API_KEY=你的 Moonshot API Key
ZHIPU_API_KEY=你的智谱 API Key
CUSTOM_API_KEY=你的自定义兼容接口 API Key
CUSTOM_BASE_URL=你的自定义兼容接口 chat completions 地址
```

7. Deploy。
8. 打开网站后，进入「模型设置」，接口地址保持默认：

```text
/api/generate
```

然后选择模型服务商和模型名。

### Netlify

1. 在 Netlify 新建站点并导入仓库。
2. Build command 留空。
3. Publish directory 填 `.`。
4. Functions directory 使用 `netlify/functions`。
5. 在 Environment variables 添加你要使用的模型服务商密钥：

```text
OPENAI_API_KEY=你的 API Key
```

也可以按需添加：

```text
DEEPSEEK_API_KEY=你的 DeepSeek API Key
DASHSCOPE_API_KEY=你的通义千问 DashScope API Key
MOONSHOT_API_KEY=你的 Moonshot API Key
ZHIPU_API_KEY=你的智谱 API Key
CUSTOM_API_KEY=你的自定义兼容接口 API Key
CUSTOM_BASE_URL=你的自定义兼容接口 chat completions 地址
```

6. Deploy。
7. 打开网站后，进入「模型设置」，把接口地址改成：

```text
/.netlify/functions/generate
```

### GitHub Pages

GitHub Pages 只能托管静态文件，不能运行本项目里的 Serverless 接口。

如果使用 GitHub Pages，你需要在「模型设置」里配置一个可被浏览器直接访问的 OpenAI-compatible 接口地址，并在页面里填写 API Key。这个方式更适合个人临时使用，不建议公开给别人。

## 本地预览

直接用浏览器打开：

```text
index.html
```

也可以用任意静态服务器托管当前目录。

## 后续接入大模型 API

当前版本已经包含真实模型调用链路：

- Vercel：`api/generate.js`
- Netlify：`netlify/functions/generate.js`
- 前端：`app.js` 中的 `callModel`

正式生成时，前端会读取已保存 Prompt，替换 `{{JD_TEXT}}` 和 `{{RESUME_TEXT}}`，再发送给模型接口。

## 统一模型接口

前端永远调用同一种请求结构：

```json
{
  "provider": "openai",
  "model": "gpt-4o-mini",
  "messages": []
}
```

Serverless 接口根据 `provider` 选择不同环境变量和模型地址：

| Provider | API Key 环境变量 | Base URL 环境变量 |
| --- | --- | --- |
| openai | `OPENAI_API_KEY` | `OPENAI_BASE_URL` |
| deepseek | `DEEPSEEK_API_KEY` | `DEEPSEEK_BASE_URL` |
| qwen | `DASHSCOPE_API_KEY` | `DASHSCOPE_BASE_URL` |
| moonshot | `MOONSHOT_API_KEY` | `MOONSHOT_BASE_URL` |
| zhipu | `ZHIPU_API_KEY` | `ZHIPU_BASE_URL` |
| custom | `CUSTOM_API_KEY` | `CUSTOM_BASE_URL` |

如果某个服务商提供 OpenAI-compatible 的 chat completions 接口，通常只需要新增一组 Provider 配置即可。

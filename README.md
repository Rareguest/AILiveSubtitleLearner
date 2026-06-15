# Language Agent

多语言实时语音识别 + 翻译 + 学习管理平台。

## 项目结构

```
agent/
├── language/              # Chrome 扩展 (Manifest V3)
├── language-web/
│   ├── frontend/          # Vue 3 学习管理网页
│   └── backend/           # Spring Boot 后端服务
```

## 功能

### Chrome 扩展

- **实时语音识别** — 通过 TabCapture 抓取浏览器标签页音频，发送至 Vosk 本地 WebSocket 服务进行流式识别
- **AI 翻译** — 识别结果自动调用 DeepSeek API 流式翻译，支持 AI 轻纠正（修正常见识别错误）
- **字幕面板** — 浮动面板实时显示识别原文 + 翻译，支持拖拽、最小化/展开、翻译显示开关
- **视频回放** — 每句字幕带时间戳，点击回放按钮可跳转到对应视频位置重新播放
- **词典查询** — 点击面板中的单词，自动查词（英文用 Free Dictionary API，其他语言用 Wiktionary），支持发音播放
- **AI 问答** — 选中文字右键问 AI，或在面板中打开聊天窗口，AI 解答语法、用法、文化背景
- **收藏单词/句子** — 字幕面板 ⭐ 按钮收藏句子，词典卡片 ⭐ 收藏单词，数据同步到网页端
- **AI 收藏指令** — 在 AI 聊天中说"收藏 xxx"，AI 自动整理为结构化数据并保存到数据库
- **学习网页入口** — 面板🌐图标一键打开学习网页

### 学习管理网页

- **登录/注册** — JWT 认证
- **Dashboard** — 总览：单词数、句子数、待复习数、今日学习量、连续天数
- **WordBook** — 单词本，查看所有收藏的单词
- **SentenceBook** — 句子本，查看所有收藏的句子
- **Review** — 间隔重复复习

### 后端服务

- Spring Boot 3.2 + MySQL + Redis + JWT
- REST API + WebSocket
- `/api/auth/**` — 认证接口（公开）
- `/api/ext/**` — 扩展接口（Extension API Key 认证，无需 JWT）
- `/api/stats/**` / `/api/words/**` / `/api/sentences/**` — 业务接口（JWT 认证）

## 启动【本项目目前基于本地服务运行】

### 前置依赖

- Node.js 18+
- Java 17+ / Maven
- MySQL 8+
- [Vosk](https://alphacephei.com/vosk/) 语音识别服务

### 1. 启动 Vosk

```bash
vosk-server --model vosk-model-small-en-us --port 2700
```

### 2. 启动后端

```bash
cd language-web/backend
# 确保 MySQL 中存在 language_agent 数据库
mvn spring-boot:run
```

后端运行在 `http://localhost:8081`

### 3. 启动前端

```bash
cd language-web/frontend
npm install
npm run dev
```

前端运行在 `http://localhost:3000`，自动代理 `/api` 到后端

### 4. 加载 Chrome 扩展

1. 打开 `chrome://extensions`
2. 开启开发者模式
3. 点击"加载已解压的扩展程序"，选择 `language/` 目录

## 扩展配置

点击扩展图标打开弹窗，配置以下项：

| 配置项 | 默认值 | 说明 |
|---|---|---|
| WebSocket 地址 | `ws://localhost:2700` | Vosk 服务地址 |
| 识别语言 | English | 语音识别源语言 |
| 翻译语言 | 中文 | AI 翻译目标语言 |
| API Key | — | DeepSeek API Key (`sk-...`) |
| API Base URL | `https://api.deepseek.com/v1/chat/completions` | AI 接口地址 |
| 模型 | `deepseek-chat` | AI 模型名 |
| 网页地址 | `http://localhost:3000` | 学习网页 URL |
| 扩展 API Key | `lang-agent-ext-key-2024` | 插件与后端的共享密钥（自动填充） |
| 用户 ID | `1` | 网页端对应用户的 ID（自动填充） |

## 技术栈

| 层 | 技术 |
|---|---|
| 扩展 | Chrome Manifest V3, TabCapture, Offscreen Document |
| 前端 | Vue 3, Vite, Pinia, Vue Router, Axios |
| 后端 | Spring Boot 3.2, Spring Security, JPA, WebSocket, Quartz |
| 数据库 | MySQL, Redis (Caffeine 本地缓存) |
| AI | DeepSeek API (流式翻译/纠正/聊天) |
| 语音 | Vosk 本地 WebSocket 流式识别 |

# AI 报告写作助手

一个开箱即用的 AI 辅助报告写作工具。上传原始文档，AI 自动建立知识库，支持智能问答、观点提炼、报告生成。

## 快速开始

```bash
# 1. 安装依赖
pip install -r requirements.txt

# 2. 配置 LLM Key
cp .env.example .env
# 编辑 .env，填入你的 LLM_API_KEY

# 3. 启动
python knowledge_server.py

# 4. 打开浏览器
open http://localhost:8888
```

## 功能

- 📄 **上传文档**：支持 .docx / .xlsx / .pdf / .txt / .md
- 🧠 **知识库**：自动解析、分块、向量化，支持语义搜索
- 💬 **智能对话**：基于知识库的 RAG 问答
- 💡 **观点提炼**：AI 自动推理候选信号，人工筛选确认
- 📝 **报告编辑**：拖拽大纲和观点组合报告，富文本编辑，版本管理
- 📎 **来源追溯**：鼠标悬停显示数据来源

## 技术栈

- **后端**：FastAPI + ChromaDB + sentence-transformers
- **前端**：纯 HTML/CSS/JS，无框架依赖
- **LLM**：兼容 OpenAI 接口（GPT / DeepSeek / 通义千问 等）

## 项目结构

```
ai-report-writer/
├── knowledge_server.py   # 主服务
├── requirements.txt      # 依赖
├── .env                  # LLM 配置
├── frontend/index.html   # 前端页面
├── knowledge/            # ChromaDB 数据（自动生成）
├── uploads/              # 上传文件（自动生成）
└── README.md
```

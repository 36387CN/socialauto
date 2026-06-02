# 社媒自动化助手

帮助小企业实现社媒运营自动化的 SaaS 工具。

## 功能

- 内容管理：创建、排期、管理多平台社媒内容
- 多平台支持：微信朋友圈、微博、抖音、小红书、公众号
- 数据看板：曝光、点击、互动数据一目了然
- 账户管理：企业信息管理

## 技术栈

- Node.js + Express 5
- SQL.js (SQLite in-browser database)
- EJS 模板引擎
- bcrypt 密码加密

## 快速开始

```bash
git clone <repo-url>
cd socialauto-app
npm install
node server.js
```

访问 http://localhost:3000

## 定价

专业版 100元/月，7天免费试用

## 部署

支持部署到 Render、Railway、Fly.io 等平台。
详见 [DEPLOY.md](DEPLOY.md)

## 项目结构

```
socialauto-app/
  server.js          # 主入口
  db.js              # 数据库层
  routes/
    auth.js          # 认证路由
    dashboard.js     # 控制台路由
  views/             # EJS 模板
  public/css/        # 样式文件
  marketing/         # 营销素材
  DEPLOY.md          # 部署指南
```

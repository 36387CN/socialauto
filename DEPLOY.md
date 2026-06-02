# 部署指南

## 部署到 Render (推荐 - 免费套餐可用)

1. 注册 https://render.com
2. 点击 "New Web Service"
3. 连接 GitHub 仓库 (或使用 "Public Git Repository" 直接指向本仓库)
4. 设置:
   - Name: `socialauto`
   - Root Directory: 留空
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - 选择 Free 套餐
5. 部署后访问 https://socialauto.onrender.com

## 部署到 Railway

1. 注册 https://railway.com
2. 点击 "New Project" → "Deploy from GitHub"
3. 选择仓库，自动部署
4. 免费套餐有月限额，适合初期

## 部署到 Fly.io

1. 安装 flyctl: `iwr https://fly.io/install.ps1 -useb | iex`
2. `fly launch`
3. `fly deploy`

## 域名配置

1. 购买域名 (如 socialauto.cn)
2. 在 Render/Railway 控制台设置自定义域名
3. 配置 DNS 的 CNAME 记录指向托管服务提供的地址

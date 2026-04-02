# 🚀 快速部署指南

## 方式一：Vercel 一键部署（推荐）⭐

### 步骤1: 准备 GitHub 仓库
```bash
# 初始化 Git（如果还没有）
git init
git add .
git commit -m "Initial commit"

# 推送到 GitHub
git remote add origin https://github.com/你的用户名/仓库名.git
git push -u origin main
```

### 步骤2: 导入到 Vercel
1. 访问 [vercel.com](https://vercel.com)
2. 点击 "Import Project"
3. 选择你的 GitHub 仓库
4. Vercel 会自动检测配置（已包含 vercel.json）
5. 点击 "Deploy" 开始部署

### 步骤3: 获取访问链接
- 部署完成后会获得类似 `https://your-app.vercel.app` 的链接
- 可以分享给客户直接访问
- 支持绑定自定义域名

**优势**：
- ✅ 免费使用
- ✅ 自动 HTTPS
- ✅ 全球 CDN 加速
- ✅ 每次 push 自动部署
- ✅ 提供预览环境

---

## 方式二：Netlify 部署

### 拖放部署（最简单）
1. 运行构建命令：
```bash
npm run build
```

2. 访问 [netlify.com](https://netlify.com)
3. 将 `dist` 文件夹拖到页面中
4. 等待部署完成

### Git 部署
1. 连接 GitHub 仓库
2. 配置构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
3. 点击 "Deploy site"

---

## 方式三：本地演示

### 启动开发服务器
```bash
# 安装依赖
npm install

# 启动服务
npm run dev
```

### 访问方式

#### 电脑浏览器
1. 打开 `http://localhost:5173`
2. 按 `F12` 打开开发者工具
3. 点击设备模拟图标（手机图标）
4. 选择 **iPhone 12/13/14** (390x844)

#### 手机浏览器（同一WiFi）
1. 查看电脑IP地址：
   ```bash
   # Windows
   ipconfig
   
   # Mac/Linux
   ifconfig
   # 或
   ip addr
   ```

2. 手机浏览器访问：
   ```
   http://你的IP地址:5173
   ```
   例如：`http://192.168.1.100:5173`

3. 使用二维码访问：
   - 浏览器打开 `/qrcode.html`
   - 手机扫码访问

---

## 🎬 演示前准备

### 1. 初始化演示数据

打开浏览器控制台（F12），输入：
```javascript
demoTools.initDemoData()
```

这会自动生成：
- ✅ 本月考勤记录（包含正常、迟到、缺勤等多种状态）
- ✅ 通知消息（未读、待处理）
- ✅ 工作时间配置
- ✅ 用户信息

### 2. 默认登录账号
```
用户名: admin
密码: admin123
```

### 3. 清除数据（重新演示）
```javascript
demoTools.clearDemoData()
```

---

## 📱 PWA 安装（可选）

### iOS (Safari)
1. 打开网站
2. 点击分享按钮 📤
3. 选择"添加到主屏幕"
4. 确认添加

### Android (Chrome)
1. 打开网站
2. 点击菜单（三个点）⋮
3. 选择"安装应用"或"添加到主屏幕"
4. 确认安装

---

## 🎯 演示流程建议

### 5分钟快速演示
1. **登录展示** (30秒) - 展示企业级登录界面
2. **主页打卡** (1分钟) - 实时时钟、水波纹动画、快捷功能
3. **勤务看板** (1.5分钟) - 列表/日历视图、内联编辑、数据统计、导出功能
4. **我的页面** (1.5分钟) - 通知消息、月度汇总、工作设置、审批流程
5. **深色模式** (30秒) - 主题切换演示

### 详细演示脚本
参见 [DEMO_GUIDE.md](./DEMO_GUIDE.md)

---

## ⚙️ 环境要求

### 开发环境
- Node.js 16+
- npm 或 pnpm
- 现代浏览器（Chrome, Safari, Edge）

### 生产环境
- 静态文件托管服务
- 支持 SPA 路由（Single Page Application）

---

## 🐛 常见问题

### Q: 页面空白？
**A:** 
1. 检查浏览器控制台错误
2. 清除浏览器缓存
3. 确认 localStorage 已启用

### Q: 移动端显示不正常？
**A:**
1. 确认视口宽度为 390px
2. 使用移动设备模拟器
3. 检查是否开启了桌面版网站模式

### Q: 演示数据没有显示？
**A:**
1. 打开控制台运行 `demoTools.initDemoData()`
2. 刷新页面
3. 确认没有控制台错误

### Q: 无法连接到本地服务器？
**A:**
1. 确认电脑和手机在同一WiFi
2. 检查防火墙设置
3. 确认端口 5173 没有被占用
4. 使用电脑实际IP地址，不是 localhost

### Q: Vercel 部署失败？
**A:**
1. 检查 `package.json` 中的依赖版本
2. 确认 `vercel.json` 配置正确
3. 查看 Vercel 构建日志
4. 确认所有文件已提交到 Git

---

## 📞 技术支持

### 有用的控制台命令

```javascript
// 查看所有演示工具
demoTools

// 初始化演示数据
demoTools.initDemoData()

// 清除所有数据
demoTools.clearDemoData()

// 生成指定月份数据
demoTools.generateMonthData(2024, 3)

// 查看当前用户信息
JSON.parse(localStorage.getItem('currentUser'))

// 查看所有 localStorage 数据
Object.keys(localStorage)
```

---

## 🎉 部署检查清单

演示前请确认：

- [ ] 代码已推送到 GitHub（如果使用 Vercel/Netlify）
- [ ] 构建命令测试成功 (`npm run build`)
- [ ] 演示数据已初始化
- [ ] 登录账号确认可用
- [ ] 移动设备模拟正确设置 (390x844)
- [ ] 网络连接稳定
- [ ] 浏览器版本最新
- [ ] 准备好演示脚本

---

**祝部署成功！** 🚀

# 中华历史时间轴

可交互的中华历史时间轴浏览器，涵盖从夏朝到新中国的726个历史事件。

**访问网站：**
- 🌍 国内推荐：https://china-history-timeline.vercel.app/
- 🌐 国际备用：https://o-kai.github.io/china-history-timeline/

## 功能
- 横向时间轴浏览，支持鼠标拖动和触摸滑动
- 双指/滚轮缩放（宏观→中观→微观三级）
- 按类别筛选（政治/军事/科技/文化/人物/社会）
- 智能密度控制，防止内容重叠
- 搜索事件、人物、朝代
- 事件详情弹窗

## 部署
纯静态页面，只需 `index.html` + `data.js` 两个文件。
- **GitHub Pages**：push main 分支自动部署
- **Vercel**：绑定 GitHub 仓库，push main 自动同步部署（国内可访问）
- **微信小程序**：WebView 方案，指向 Vercel 域名

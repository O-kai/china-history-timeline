# 中华历史时间轴 - 架构文档

> 本文档定义项目的完整框架、数据规范、组件布局和交互模型。
> 任何修改前请先阅读本文档，修改后请同步更新相关章节。

---

## 1. 项目概述

一个可交互的中华历史时间轴浏览器，支持从夏朝（前2070年）到现代（2026年）的726个历史事件浏览。MVP重点为交互手感和视觉风格。

### 部署地址
| 平台 | 地址 | 说明 |
|------|------|------|
| GitHub Pages | https://o-kai.github.io/china-history-timeline/ | 国际线路 |
| Cloudflare Pages | https://china-history-timeline-c4m.pages.dev/ | 国内推荐 |
| Cloudflare Workers | https://china-history-timeline.jsk-developer.workers.dev/ | 国内备用 |
| Vercel | https://china-history-timeline.vercel.app/ | 国内不稳定 |

**部署规则**：push main → 四路自动部署（GitHub Pages + CF Pages + CF Workers + Vercel）

---

## 2. 文件结构

```
├── index.html          # 主程序（单文件，含CSS+JS）
├── data.js             # 事件数据（726条）
├── favicon.png         # 网站图标
├── manifest.json       # PWA配置
├── sw.js               # Service Worker（离线缓存）
├── ARCHITECTURE.md     # 本文档
├── CHANGELOG.md        # 变更记录
├── README.md           # 项目说明
├── archive/            # 版本归档
│   └── v1.0/
├── data.js.bak         # 旧3级数据备份
└── deploy/             # Git部署目录（.git在此目录）
```

**重要**：`deploy/` 目录是Git仓库根目录，push main 触发自动部署。修改后必须将 index.html 和 data.js 同步到 deploy/。

---

## 3. 数据规范

### 3.1 事件数据格式（data.js）

```javascript
const TIMELINE_DATA = [
  [year, month, day, title, summary, detail, context, image, dynasty, level, category]
];
```

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| year | number | 年份（负数=公元前） | -221 |
| month | number/null | 月份 | 1 |
| day | number/null | 日期 | 1 |
| title | string | 事件标题 | 秦始皇统一六国 |
| summary | string | 简述（卡片显示） | 秦王嬴政灭六国... |
| detail | string | 详细描述（详情面板） | 秦王嬴政先后灭... |
| context | string/null | 历史背景 | 战国末期... |
| image | string/null | 图片URL（暂未使用） | null |
| dynasty | string | 所属朝代 | 秦 |
| level | number | 重要性等级 1-5 | 1 |
| category | string | 分类 | 政治 |

### 3.2 重要性等级（level）

| Level | 含义 | 数量 | 显示特征 |
|-------|------|------|----------|
| 1 | 文明转折点 | 41 | 14px圆点+强辉光+脉冲动画+加粗卡片 |
| 2 | 重大历史事件 | 75 | 10px圆点+辉光+脉冲动画+加粗卡片 |
| 3 | 重要事件 | 205 | 7px圆点+弱辉光 |
| 4 | 有影响力事件 | 306 | 5px圆点 |
| 5 | 补充/过渡性事件 | 99 | 4px圆点+半透明 |

### 3.3 分类体系（category）

| 分类 | CSS变量 | 色值 | 位置 |
|------|---------|------|------|
| 政治 | --cat-politics | #e74c3c | 上半区 |
| 科技 | --cat-science | #3498db | 上半区 |
| 文化 | --cat-culture | #9b59b6 | 上半区 |
| 军事 | --cat-military | #e67e22 | 下半区 |
| 人物 | --cat-person | #f39c12 | 下半区 |
| 社会 | --cat-society | #2ecc71 | 下半区 |

### 3.4 朝代数据

定义在 index.html 的 `dynasties` 数组中，25个朝代。`overlap` 字段标记与主朝代并存的政权。

### 3.5 人口数据

`POP_DATA` 数组，单位为**百万人（millions）**。显示时通过 `formatPop()` 转换为中文单位（万/亿）。

**转换公式**：`百万人 × 100 = 万人`，`万人 ÷ 10000 = 亿人`

`POP_MILESTONES` 定义关键人口标注点，在缩放等级3+时显示。

---

## 4. 视觉系统

### 4.1 配色

```
背景主色: #0a0a14 (--bg-primary)
背景辅色: #12122a (--bg-secondary)
卡片背景: rgba(18, 18, 42, 0.94)
文字主色: #e8e0d0 (--text-primary)
文字辅色: #a89b8c (--text-secondary)
文字暗色: #5a5248 (--text-muted)
金色主色: #c9a96e (--gold)
金色亮色: #dbb87a (--gold-light)
金色暗色: #8a6d3b (--gold-dark)
金色边框: rgba(201, 169, 110, 0.25)
金色辉光: rgba(201, 169, 110, 0.15)
```

### 4.2 字体

`"PingFang SC", "Microsoft YaHei", "Hiragino Sans GB", sans-serif`

---

## 5. 布局系统

### 5.1 页面布局（固定定位元素）

```
┌─────────────────────────────────────────────┐
│ [Header] 标题 | 搜索框 | 全屏按钮   top:0  │
│ [Dynasty Nav] 朝代快跳栏           top:46px │
│ [Focus Indicator] 当前朝代/缩放     top:78px │
│                                              │
│ [btn-home]⌂                    top:54px →  │
│                                              │
│              ┌─── 时间轴主体 ───┐            │
│              │ 上半区事件卡片    │            │
│              │ ─── 时间线 ──── │            │
│              │ 下半区事件卡片    │            │
│              │ 人口曲线(SVG)    │            │
│              └─────────────────┘            │
│                                              │
│ [Right Toolbar]                     right:10px│
│   📈 人口开关                                │
│   💬 反馈                           bottom:50│
│   ── 分隔线 ──                               │
│   密度滑块                                   │
│                                              │
│ [Scale Bar] 比例尺          bottom:40 left:14│
│ [Zoom Indicator]           bottom:40 center  │
│ [Filter Bar] 分类筛选       bottom:10 center │
└─────────────────────────────────────────────┘
```

### 5.2 右侧工具栏（right-toolbar）

统一容器，从上到下：
1. 人口曲线开关按钮（📈），active 类控制高亮
2. 反馈按钮（💬），点击打开反馈模态框
3. 分隔线
4. 密度控制区（标签+滑块+数值）

**所有右侧控件统一在 `.right-toolbar` 容器内，禁止添加新的 fixed 定位按钮到右侧。**

---

## 6. 交互模型

### 6.1 缩放体系

| 等级 | 像素/年阈值 | 标签 | 可见事件密度 |
|------|------------|------|-------------|
| Z1 | < 0.15 | 宏观 · 朝代 | vw/100 |
| Z2 | < 0.4 | 中观 · 年代 | vw/70 |
| Z3 | < 1.0 | 细节 · 事件 | vw/50 |
| Z4 | < 2.5 | 微观 · 始末 | vw/40 |
| Z5 | ≥ 2.5 | 精览 · 全貌 | vw/30 |

### 6.2 触控交互

- **单指滑动**：水平移动时间轴
- **双指缩放**：三级缩放控制
  - Pinch冷却期：300ms
  - Pinch死区：10px
  - 智能恢复：单指操作后自动恢复滑动模式
- **快滑惯性**：velocity衰减系数 0.93

### 6.3 事件交互

1. 点击圆点 → 卡片展开（显示summary）
2. 点击"查看详情" → 打开详情面板
3. 点击空白 → 关闭详情面板
4. 事件卡片有 important 标记（L1/L2级别）

---

## 7. 性能策略

### 7.1 虚拟渲染

- 只渲染视口内可见的事件节点
- 节点池复用：`activeNodes` Map + `poolNodes` 数组
- rAF批量渲染：`requestRender()` → `doRender()` 去重

### 7.2 智能密度

- 基于缩放等级和视口宽度计算最大可见事件数
- 焦点权重系统：当前朝代事件优先显示
- 5级事件优先级：L1 > L2 > L3 > L4 > L5

---

## 8. 修改规范

### 8.1 修改前检查清单

- [ ] 阅读 ARCHITECTURE.md 中相关章节
- [ ] 确认修改不会破坏现有布局（特别是右侧工具栏区域）
- [ ] 确认数据格式正确（特别是人口单位为百万人）
- [ ] 确认引号使用中文引号""或单引号''

### 8.2 修改后验证清单

- [ ] `node -e "new Function(require('fs').readFileSync('index.html','utf8').match(/<script>([\\s\\S]*?)<\\/script>/)[1])"` 通过
- [ ] 右侧工具栏无重叠（人口/反馈/密度三个区域）
- [ ] 人口数据显示正确（如2020年=14亿，不是1.4千万）
- [ ] 所有缩放级别功能正常
- [ ] 同步 index.html + data.js 到 deploy/ 目录
- [ ] 更新 sw.js 缓存版本（timeline-vX → vY）
- [ ] 更新 CHANGELOG.md

### 8.3 右侧按钮铁律

**禁止在右侧添加新的 fixed 定位元素。** 所有右侧控件必须放在 `.right-toolbar` 容器内。新增按钮使用 `.toolbar-btn` 类。

---

## 9. 微信小程序

- 分支：`wechat-miniprogram`
- 方案：原生小程序代码（非 web-view）
- 目标：与网页端效果、内容一致
- 数据源：共享 data.js 中的事件数据

---

## 10. 版本历史摘要

| 版本 | 日期 | 主要变更 |
|------|------|----------|
| v1.0 | 2026-06-01 | 初始版本，3级重要性 |
| v1.1 | 2026-06-02 | 朝代跳转+分类固定半区+人口曲线 |
| v1.2 | 2026-06-02 | 人口曲线+朝代标签 |
| v1.3 | 2026-06-02 | 重叠朝代跳转修复+年份修正 |
| v1.4 | 2026-06-04 | 动画竞态修复+斜切分行布局 |
| v1.5 | 2026-06-06 | 按钮布局+人口数据+边界修复 |
| v1.6 | 2026-06-09 | 5级重要性体系升级 |
| v1.7 | 2026-06-10 | 右侧工具栏统一+人口显示修复+框架文档 |

详见 CHANGELOG.md

# 期权定价互动教程

滑动卡片式学习应用，类似短视频体验，每张卡片一个知识点。

## 目录结构

```
pricing/
├── index.html              # 主入口（精简，卡片由 JS 渲染）
├── shared/
│   ├── styles.css          # 全局样式（滑动卡片、响应式）
│   ├── core.js             # 核心工具：BS定价、Delta、Payoff
│   └── main.js             # 主应用：卡片渲染、滑动控制
└── cards/                  # 按知识点分类的卡片模块
    ├── basics.js           # 基础 (卡片1-3)：什么是期权、Call/Put、多头/空头
    ├── premium.js          # 权利金 (卡片4-5)：权利金、到期盈亏
    ├── pricing.js          # 定价 (卡片6-7)：5个因素、BS计算器
    ├── greeks.js           # Greeks (卡片8-10)：Delta、Theta、Vega
    ├── pnl.js              # PnL图 (卡片11)：盈亏曲线
    └── strategies.js       # 策略 (卡片12)：牛市价差、跨式、蝶式、铁鹰
```

## 知识点卡片

| 模块 | 卡片 | 内容 | 互动 |
|------|------|------|------|
| basics | 1 | 什么是期权 | 房子定金例子 |
| basics | 2 | Call vs Put | 记忆口诀 |
| basics | 3 | 多头 vs 空头 | 风险收益对比 |
| premium | 4 | 权利金 | 滑块调整 |
| premium | 5 | 到期盈亏 | 实时计算 PnL |
| pricing | 6 | 5个定价因素 | - |
| pricing | 7 | BS计算器 | 输入参数计算 |
| greeks | 8 | Delta | 可视化进度条 |
| greeks | 9 | Theta | 冰块动画 |
| greeks | 10 | Vega | 波浪动画 |
| pnl | 11 | PnL图 | Chart.js 绘图 |
| strategies | 12 | 组合策略 | 点击切换策略 |

## 添加新卡片

1. 在对应的 `cards/*.js` 文件中添加卡片对象
2. 在 `shared/main.js` 的 `allCards` 数组中引用

卡片对象格式：
```js
{
  theme: 'blue|green|purple|orange',
  badge: '标签文字',
  title: '标题',
  render: () => `HTML内容`,
  init: () => { /* 初始化交互 */ }
}
```

## 本地运行

```bash
npx http-server . -p 8080
# 打开 http://localhost:8080/tools/pricing/
```

## GitHub Pages

直接部署即可，访问 `https://<user>.github.io/<repo>/tools/pricing/`
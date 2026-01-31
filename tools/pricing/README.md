# 期权定价互动教程（tools/pricing）

这是一个纯前端的交互式学习应用，演示期权基础、Black–Scholes 定价、Greeks、PnL 可视化与常见策略示例。

启动方法（本地）：

1. 使用 `npx http-server`（推荐）：

```bash
npm run start
```

然后在浏览器打开 `http://localhost:8080`，或直接打开 `tools/pricing/index.html`（某些浏览器限制本地文件访问）。

主要文件：
- index.html — 主界面
- app.js — 交互逻辑：BS 公式、Greeks、PnL 绘图、策略说明
- styles.css — 样式
- package.json — 包含 `npm run start` 命令（调用 `npx http-server`）

示例练习：
- 在“定价 & Greeks”输入参数并点击“计算”，观察价格与 Greeks
- 在“模拟器”中调整 `S0`、`K`、`premium`，点击“绘制 PnL”，拖动“观察价格”滑块查看即时 PnL
- 在“策略”中尝试不同策略按钮，了解基本构造与风险收益形态

扩展建议：
- 增加真实组合（多腿）支持与仓位可视化
- 加入历史数据并展示隐含波动率
- 增加 Monte Carlo 模拟器与期权定价误差对比

免责声明：仅供学习使用，不构成投资建议。
// ===== 卡片模块：基础知识 (卡片 1-3) =====
// 什么是期权、Call/Put、多头/空头

const BasicsCards = {
  // 卡片1: 什么是期权
  whatIsOption: {
    theme: 'blue',
    badge: '基础',
    title: '什么是期权？',
    render: () => `
      <p class="big-text">一份<em>合同</em>，让你有权在未来以<strong>约定价格</strong>买/卖某资产</p>
      <div class="example-box">
        <div class="example-title">🏠 生活例子</div>
        <p>你付 5 万定金，锁定一套房子的价格 300 万。3 个月内你可以选择买或不买。</p>
        <ul>
          <li>房价涨到 350 万 → 你行权赚 50 万</li>
          <li>房价跌到 250 万 → 你放弃，只亏定金 5 万</li>
        </ul>
      </div>
      <div class="swipe-hint">↑ 上滑继续</div>
    `,
    init: () => {}
  },

  // 卡片2: Call vs Put
  callVsPut: {
    theme: 'green',
    badge: '基础',
    title: 'Call 看涨 vs Put 看跌',
    render: () => `
      <div class="two-col">
        <div class="col">
          <div class="icon-big">📈</div>
          <h3>Call 看涨</h3>
          <p>有权<strong>买入</strong></p>
          <p class="small">看好标的会涨</p>
        </div>
        <div class="col">
          <div class="icon-big">📉</div>
          <h3>Put 看跌</h3>
          <p>有权<strong>卖出</strong></p>
          <p class="small">看好标的会跌</p>
        </div>
      </div>
      <div class="example-box">
        <div class="example-title">💡 记忆口诀</div>
        <p><b>Call = 叫你来买</b>（我有权买）<br><b>Put = 放出去卖</b>（我有权卖）</p>
      </div>
    `,
    init: () => {}
  },

  // 卡片3: 多头 vs 空头
  longVsShort: {
    theme: 'purple',
    badge: '基础',
    title: '多头 vs 空头',
    render: () => `
      <div class="two-col">
        <div class="col">
          <div class="icon-big">🛒</div>
          <h3>多头 Long</h3>
          <p><strong>买</strong>期权</p>
          <p class="small">付权利金，拥有权利</p>
        </div>
        <div class="col">
          <div class="icon-big">🏪</div>
          <h3>空头 Short</h3>
          <p><strong>卖</strong>期权</p>
          <p class="small">收权利金，承担义务</p>
        </div>
      </div>
      <div class="example-box">
        <p>🛒 买家（多头）：付 5 元权利金，赌对了能赚很多<br>
           🏪 卖家（空头）：收 5 元权利金，大概率白赚，但有爆仓风险</p>
      </div>
    `,
    init: () => {}
  }
};

window.BasicsCards = BasicsCards;
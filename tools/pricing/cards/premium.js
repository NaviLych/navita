// ===== 卡片模块：权利金与盈亏 (卡片 4-5) =====

const PremiumCards = {
  // 卡片4: 权利金
  premium: {
    theme: 'orange',
    badge: '互动',
    title: '权利金 = 期权的价格',
    render: () => `
      <p>买期权要付钱，这笔钱叫<strong>权利金 (Premium)</strong></p>
      <div class="interactive-box">
        <div class="sim-row">
          <label>你付的权利金</label>
          <input type="range" id="premium1" min="1" max="20" value="5">
          <span id="premium1Val">5 元</span>
        </div>
        <div class="result-card">
          <p>📉 最大亏损 = <span id="maxLoss1">5</span> 元（你付的钱）</p>
          <p>📈 最大收益 = <span class="highlight-text">无限</span>（标的可以涨很多）</p>
        </div>
      </div>
      <p class="small">拖动滑块感受一下！权利金越高，成本越大</p>
    `,
    init: () => {
      const slider = document.getElementById('premium1');
      const valSpan = document.getElementById('premium1Val');
      const lossSpan = document.getElementById('maxLoss1');
      if (slider) {
        slider.addEventListener('input', () => {
          valSpan.textContent = slider.value + ' 元';
          lossSpan.textContent = slider.value;
        });
      }
    }
  },

  // 卡片5: 到期盈亏计算
  expiryPnL: {
    theme: 'blue',
    badge: '核心',
    title: '到期时你赚多少？',
    render: () => `
      <p>假设你买了一个执行价 100 的 <b>Call</b>，付了 5 元权利金</p>
      <div class="interactive-box">
        <div class="sim-row">
          <label>到期时标的价格</label>
          <input type="range" id="expPrice" min="80" max="130" value="100">
          <span id="expPriceVal">100</span>
        </div>
        <div class="result-card">
          <p>内在价值 = max(S-K, 0) = <span id="intrinsic">0</span></p>
          <p><b>你的盈亏 = <span id="pnl1" class="big-num">-5</span> 元</b></p>
        </div>
      </div>
      <p class="small">试试拖到 110、120 看看！</p>
    `,
    init: () => {
      const slider = document.getElementById('expPrice');
      const valSpan = document.getElementById('expPriceVal');
      const intrSpan = document.getElementById('intrinsic');
      const pnlSpan = document.getElementById('pnl1');
      
      if (slider) {
        slider.addEventListener('input', () => {
          const S = +slider.value;
          const K = 100, premium = 5;
          valSpan.textContent = S;
          const intr = Math.max(S - K, 0);
          intrSpan.textContent = intr;
          const pnl = intr - premium;
          pnlSpan.textContent = (pnl >= 0 ? '+' : '') + pnl;
          pnlSpan.style.color = pnl >= 0 ? '#22c55e' : '#ef4444';
        });
      }
    }
  }
};

window.PremiumCards = PremiumCards;
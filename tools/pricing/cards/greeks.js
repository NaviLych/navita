// ===== 卡片模块：Greeks (卡片 8-10) =====

const GreeksCards = {
  // 卡片8: Delta
  delta: {
    theme: 'orange',
    badge: 'Greeks',
    title: 'Delta (Δ) 速度表',
    render: () => `
      <p>标的涨 1 元，期权涨多少？</p>
      <div class="delta-visual">
        <div class="delta-bar">
          <div class="delta-fill" id="deltaFill" style="width:50%"></div>
          <span class="delta-label" id="deltaLabel">Δ = 0.50</span>
        </div>
      </div>
      <div class="interactive-box">
        <div class="sim-row">
          <label>标的价格 S</label>
          <input type="range" id="deltaS" min="70" max="130" value="100">
          <span id="deltaSVal">100</span>
        </div>
        <p class="small">K=100 的 Call，拖动看 Delta 变化</p>
        <div class="result-card">
          <p>S &lt; K (虚值): Delta 接近 0</p>
          <p>S = K (平值): Delta ≈ 0.5</p>
          <p>S &gt; K (实值): Delta 接近 1</p>
        </div>
      </div>
    `,
    init: () => {
      const slider = document.getElementById('deltaS');
      const valSpan = document.getElementById('deltaSVal');
      const fill = document.getElementById('deltaFill');
      const label = document.getElementById('deltaLabel');
      
      if (slider) {
        slider.addEventListener('input', () => {
          const S = +slider.value;
          valSpan.textContent = S;
          const d = OptionUtils.bsDelta(S, 100, 0.03, 0.2, 0.5, 'call');
          fill.style.width = (d * 100) + '%';
          label.textContent = 'Δ = ' + d.toFixed(2);
        });
      }
    }
  },

  // 卡片9: Theta
  theta: {
    theme: 'blue',
    badge: 'Greeks',
    title: 'Theta (Θ) 时间杀手',
    render: () => `
      <p>期权每天都在<strong>贬值</strong>！</p>
      <div class="theta-animation">
        <div class="ice-cube" id="iceCube">🧊</div>
        <p class="small">期权 = 融化的冰块</p>
      </div>
      <div class="example-box">
        <p><b>Theta = -0.05</b> 意味着：<br>什么都不做，明天你的期权就少值 0.05 元</p>
        <p class="small">💡 所以"买入并持有"期权是危险的！</p>
      </div>
    `,
    init: () => {}
  },

  // 卡片10: Vega
  vega: {
    theme: 'green',
    badge: 'Greeks',
    title: 'Vega (ν) 波动率敏感度',
    render: () => `
      <p>市场越恐慌，期权越值钱</p>
      <div class="vega-visual">
        <div class="wave" id="wave1">〰️〰️〰️</div>
        <div class="wave big" id="wave2">🌊🌊🌊🌊🌊</div>
      </div>
      <div class="example-box">
        <p><b>波动率从 20% 涨到 30%</b></p>
        <p>如果 Vega = 0.15，期权涨 <b>0.15 × 10 = 1.5 元</b></p>
        <p class="small">💡 财报前买期权，就是在赌 Vega！</p>
      </div>
    `,
    init: () => {}
  }
};

window.GreeksCards = GreeksCards;
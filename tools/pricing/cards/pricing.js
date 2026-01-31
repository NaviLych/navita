// ===== 卡片模块：定价 (卡片 6-7) =====

const PricingCards = {
  // 卡片6: 5个定价因素
  factors: {
    theme: 'green',
    badge: '定价',
    title: '期权贵不贵？5 个因素',
    render: () => `
      <div class="factors-list">
        <div class="factor"><span class="factor-icon">📊</span><b>S</b> 标的价格</div>
        <div class="factor"><span class="factor-icon">🎯</span><b>K</b> 执行价</div>
        <div class="factor"><span class="factor-icon">🌊</span><b>σ</b> 波动率 <span class="tag up">↑越高越贵</span></div>
        <div class="factor"><span class="factor-icon">⏰</span><b>T</b> 到期时间 <span class="tag up">↑越长越贵</span></div>
        <div class="factor"><span class="factor-icon">🏦</span><b>r</b> 利率</div>
      </div>
      <div class="example-box">
        <p>💡 <b>波动率</b>和<b>时间</b>是最重要的！<br>股票越活跃、到期越远 → 期权越贵</p>
      </div>
    `,
    init: () => {}
  },

  // 卡片7: BS计算器
  bsCalculator: {
    theme: 'purple',
    badge: '互动',
    title: 'Black-Scholes 计算器',
    render: () => `
      <p class="small">调整参数，实时看理论价格</p>
      <div class="interactive-box compact">
        <div class="sim-grid">
          <label>S<input type="number" id="bsS" value="100"></label>
          <label>K<input type="number" id="bsK" value="100"></label>
          <label>σ<input type="number" id="bsSigma" value="0.2" step="0.05"></label>
          <label>T<input type="number" id="bsT" value="0.5" step="0.1"></label>
          <label>r<input type="number" id="bsR" value="0.03" step="0.01"></label>
          <label>类型<select id="bsType"><option value="call">Call</option><option value="put">Put</option></select></label>
        </div>
        <div class="result-card">
          <p class="big-result">理论价格 = <span id="bsResult">5.88</span> 元</p>
        </div>
      </div>
    `,
    init: () => {
      const ids = ['bsS', 'bsK', 'bsSigma', 'bsT', 'bsR', 'bsType'];
      const resultSpan = document.getElementById('bsResult');
      
      function update() {
        const S = +document.getElementById('bsS')?.value || 100;
        const K = +document.getElementById('bsK')?.value || 100;
        const sigma = +document.getElementById('bsSigma')?.value || 0.2;
        const T = +document.getElementById('bsT')?.value || 0.5;
        const r = +document.getElementById('bsR')?.value || 0.03;
        const type = document.getElementById('bsType')?.value || 'call';
        const price = OptionUtils.bsPrice(S, K, r, sigma, T, type);
        if (resultSpan) resultSpan.textContent = price.toFixed(2);
      }

      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', update);
      });
      update();
    }
  }
};

window.PricingCards = PricingCards;
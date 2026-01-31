// ===== 卡片模块：定价 (卡片 6-13) =====

const PricingCards = {
  // 卡片6: 5个定价因素
  factors: {
    theme: 'green',
    badge: '定价',
    title: '期权贵不贵？5 个因素',
    chapter: '定价原理',
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

  // 卡片7: BS公式详解
  bsFormula: {
    theme: 'purple',
    badge: '定价',
    title: 'Black-Scholes 公式',
    chapter: '定价原理',
    render: () => `
      <p class="small">1973年诺贝尔奖级别的定价模型</p>
      <div class="formula-box">
        <div class="formula formula-large">C = S·N(d₁) - Ke⁻ʳᵀ·N(d₂)</div>
        <div class="formula">P = Ke⁻ʳᵀ·N(-d₂) - S·N(-d₁)</div>
        <div class="formula-desc">其中 N(x) 是标准正态分布累积函数</div>
      </div>
      <div class="formula-box">
        <div class="formula">d₁ = [ln(S/K) + (r + σ²/2)T] / (σ√T)</div>
        <div class="formula">d₂ = d₁ - σ√T</div>
      </div>
      <div class="var-grid">
        <div class="var-item"><span class="var-symbol">S</span><span class="var-desc">标的价格</span></div>
        <div class="var-item"><span class="var-symbol">K</span><span class="var-desc">执行价格</span></div>
        <div class="var-item"><span class="var-symbol">r</span><span class="var-desc">无风险利率</span></div>
        <div class="var-item"><span class="var-symbol">σ</span><span class="var-desc">波动率</span></div>
        <div class="var-item"><span class="var-symbol">T</span><span class="var-desc">到期时间(年)</span></div>
        <div class="var-item"><span class="var-symbol">N()</span><span class="var-desc">正态CDF</span></div>
      </div>
    `,
    init: () => {}
  },

  // 卡片8: BS计算器(带例子)
  bsCalculator: {
    theme: 'purple',
    badge: '互动',
    title: 'Black-Scholes 计算器',
    chapter: '定价原理',
    render: () => `
      <p class="small">调整参数，实时看理论价格</p>
      <div class="interactive-box compact">
        <div class="sim-grid">
          <label>S 标的<input type="number" id="bsS" value="100"></label>
          <label>K 执行价<input type="number" id="bsK" value="100"></label>
          <label>σ 波动率<input type="number" id="bsSigma" value="0.2" step="0.05"></label>
          <label>T 时间(年)<input type="number" id="bsT" value="0.5" step="0.1"></label>
          <label>r 利率<input type="number" id="bsR" value="0.03" step="0.01"></label>
          <label>类型<select id="bsType"><option value="call">Call</option><option value="put">Put</option></select></label>
        </div>
        <div class="result-card">
          <p class="big-result">理论价格 = <span id="bsResult">5.88</span> 元</p>
          <p class="small">d₁ = <span id="bsD1">0.32</span>, d₂ = <span id="bsD2">0.18</span></p>
        </div>
      </div>
      <div class="example-box">
        <div class="example-title">📝 计算步骤示例 (S=100, K=100, σ=20%, T=0.5年, r=3%)</div>
        <div class="step-list">
          <div class="step"><span class="step-num">1</span><span class="step-content">d₁ = [ln(100/100) + (0.03+0.04/2)×0.5] / (0.2×√0.5) ≈ 0.32</span></div>
          <div class="step"><span class="step-num">2</span><span class="step-content">d₂ = 0.32 - 0.2×√0.5 ≈ 0.18</span></div>
          <div class="step"><span class="step-num">3</span><span class="step-content">Call = 100×N(0.32) - 100×e⁻⁰·⁰¹⁵×N(0.18) ≈ 5.88</span></div>
        </div>
      </div>
    `,
    init: () => {
      const ids = ['bsS', 'bsK', 'bsSigma', 'bsT', 'bsR', 'bsType'];
      const resultSpan = document.getElementById('bsResult');
      const d1Span = document.getElementById('bsD1');
      const d2Span = document.getElementById('bsD2');
      
      function update() {
        const S = +document.getElementById('bsS')?.value || 100;
        const K = +document.getElementById('bsK')?.value || 100;
        const sigma = +document.getElementById('bsSigma')?.value || 0.2;
        const T = +document.getElementById('bsT')?.value || 0.5;
        const r = +document.getElementById('bsR')?.value || 0.03;
        const type = document.getElementById('bsType')?.value || 'call';
        
        // 计算 d1, d2
        if (T > 0) {
          const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
          const d2 = d1 - sigma * Math.sqrt(T);
          if (d1Span) d1Span.textContent = d1.toFixed(2);
          if (d2Span) d2Span.textContent = d2.toFixed(2);
        }
        
        const price = OptionUtils.bsPrice(S, K, r, sigma, T, type);
        if (resultSpan) resultSpan.textContent = price.toFixed(2);
      }

      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', update);
      });
      update();
    }
  },

  // 卡片9: 期权平价定理介绍
  putCallParity: {
    theme: 'blue',
    badge: '核心',
    title: '期权平价定理 Put-Call Parity',
    chapter: '定价原理',
    render: () => `
      <p class="big-text">Call 和 Put 之间存在<em>数学等式</em></p>
      <div class="formula-box">
        <div class="formula formula-large">C - P = S - Ke⁻ʳᵀ</div>
        <div class="formula-desc">对于相同标的、相同执行价、相同到期日的欧式期权</div>
      </div>
      <div class="parity-visual">
        <div class="parity-item call">Call<br><b>C</b></div>
        <span class="parity-op">-</span>
        <div class="parity-item put">Put<br><b>P</b></div>
        <span class="parity-op">=</span>
        <div class="parity-item stock">股票<br><b>S</b></div>
        <span class="parity-op">-</span>
        <div class="parity-item bond">债券<br><b>Ke⁻ʳᵀ</b></div>
      </div>
      <div class="example-box">
        <p>💡 <b>直觉理解</b>：买入 Call 同时卖出 Put = 合成了一个股票多头（去掉融资成本）</p>
      </div>
    `,
    init: () => {}
  },

  // 卡片10: 平价定理计算器
  parityCalculator: {
    theme: 'blue',
    badge: '互动',
    title: '平价定理计算器',
    chapter: '定价原理',
    render: () => `
      <p class="small">验证 C - P = S - Ke⁻ʳᵀ 是否成立</p>
      <div class="interactive-box compact">
        <div class="sim-grid">
          <label>Call价格<input type="number" id="parityC" value="5.88"></label>
          <label>Put价格<input type="number" id="parityP" value="4.40"></label>
          <label>标的S<input type="number" id="parityS" value="100"></label>
          <label>执行价K<input type="number" id="parityK" value="100"></label>
          <label>利率r<input type="number" id="parityR" value="0.03" step="0.01"></label>
          <label>时间T<input type="number" id="parityT" value="0.5" step="0.1"></label>
        </div>
        <div class="result-card">
          <p>左边 C - P = <span id="parityLeft" class="big-num">1.48</span></p>
          <p>右边 S - Ke⁻ʳᵀ = <span id="parityRight" class="big-num">1.48</span></p>
          <p id="parityStatus" style="margin-top:8px;font-weight:bold;color:#22c55e">✓ 平价关系成立！</p>
        </div>
      </div>
      <div class="example-box">
        <div class="example-title">🔥 套利机会</div>
        <p>如果左边 ≠ 右边，存在<b>无风险套利</b>：</p>
        <ul>
          <li>C - P > S - Ke⁻ʳᵀ → 卖 Call，买 Put，买股票</li>
          <li>C - P < S - Ke⁻ʳᵀ → 买 Call，卖 Put，卖股票</li>
        </ul>
      </div>
    `,
    init: () => {
      const ids = ['parityC', 'parityP', 'parityS', 'parityK', 'parityR', 'parityT'];
      
      function update() {
        const C = +document.getElementById('parityC')?.value || 0;
        const P = +document.getElementById('parityP')?.value || 0;
        const S = +document.getElementById('parityS')?.value || 100;
        const K = +document.getElementById('parityK')?.value || 100;
        const r = +document.getElementById('parityR')?.value || 0.03;
        const T = +document.getElementById('parityT')?.value || 0.5;
        
        const left = C - P;
        const right = S - K * Math.exp(-r * T);
        
        document.getElementById('parityLeft').textContent = left.toFixed(2);
        document.getElementById('parityRight').textContent = right.toFixed(2);
        
        const diff = Math.abs(left - right);
        const status = document.getElementById('parityStatus');
        if (diff < 0.1) {
          status.textContent = '✓ 平价关系成立！';
          status.style.color = '#22c55e';
        } else {
          status.textContent = `⚠️ 差异 ${diff.toFixed(2)}，可能存在套利！`;
          status.style.color = '#fbbf24';
        }
      }
      
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', update);
      });
      update();
    }
  },

  // 卡片11: 内在价值与时间价值
  intrinsicTime: {
    theme: 'green',
    badge: '定价',
    title: '内在价值 vs 时间价值',
    chapter: '定价原理',
    render: () => `
      <p class="big-text">期权价格 = <em>内在价值</em> + <strong>时间价值</strong></p>
      <div class="value-breakdown">
        <div class="value-part intrinsic">
          <div class="value-amount" id="intrinsicVal">5.00</div>
          <div class="value-label">内在价值<br>立即行权能赚多少</div>
        </div>
        <div class="value-part time">
          <div class="value-amount" id="timeVal">0.88</div>
          <div class="value-label">时间价值<br>还有希望的溢价</div>
        </div>
      </div>
      <div class="interactive-box">
        <div class="sim-row">
          <label>标的价格 S</label>
          <input type="range" id="ivS" min="80" max="120" value="105">
          <span id="ivSVal">105</span>
        </div>
        <div class="result-card">
          <p>K=100 的 Call，当前市价 <span id="ivTotal" class="highlight-text">6.50</span> 元</p>
          <p class="small">内在 = max(S-K, 0) | 时间 = 市价 - 内在</p>
        </div>
      </div>
      <div class="example-box">
        <p>💡 <b>平值期权</b>：内在价值=0，全是时间价值<br>
           <b>深度实值</b>：主要是内在价值，时间价值很少</p>
      </div>
    `,
    init: () => {
      const slider = document.getElementById('ivS');
      if (!slider) return;
      
      function update() {
        const S = +slider.value;
        const K = 100;
        document.getElementById('ivSVal').textContent = S;
        
        const intrinsic = Math.max(S - K, 0);
        const total = OptionUtils.bsPrice(S, K, 0.03, 0.2, 0.5, 'call');
        const timeVal = total - intrinsic;
        
        document.getElementById('intrinsicVal').textContent = intrinsic.toFixed(2);
        document.getElementById('timeVal').textContent = timeVal.toFixed(2);
        document.getElementById('ivTotal').textContent = total.toFixed(2);
      }
      
      slider.addEventListener('input', update);
      update();
    }
  },

  // 卡片12: 隐含波动率
  impliedVol: {
    theme: 'orange',
    badge: '进阶',
    title: '隐含波动率 IV',
    chapter: '定价原理',
    render: () => `
      <p class="big-text">市场<em>预期</em>未来的波动有多大？</p>
      <p class="small">从期权市价反推出的波动率</p>
      <div class="iv-meter">
        <div class="iv-marker" id="ivMarker" style="left:30%"></div>
      </div>
      <div class="iv-labels">
        <span>10% 平静</span>
        <span>30% 正常</span>
        <span>50%+ 恐慌</span>
      </div>
      <div class="interactive-box">
        <div class="sim-row">
          <label>IV 水平</label>
          <input type="range" id="ivLevel" min="10" max="80" value="30">
          <span id="ivLevelVal">30%</span>
        </div>
        <div class="result-card">
          <p>同样的期权，当 IV 变化时：</p>
          <p>IV=<span id="ivShow">30</span>%: Call价格 = <span id="ivPrice" class="big-num">5.88</span></p>
        </div>
      </div>
      <div class="example-box">
        <p>📈 <b>VIX 指数</b>就是 S&P500 的隐含波动率</p>
        <p class="small">VIX > 30 通常意味着市场恐慌</p>
      </div>
    `,
    init: () => {
      const slider = document.getElementById('ivLevel');
      if (!slider) return;
      
      function update() {
        const iv = +slider.value;
        document.getElementById('ivLevelVal').textContent = iv + '%';
        document.getElementById('ivShow').textContent = iv;
        
        const price = OptionUtils.bsPrice(100, 100, 0.03, iv/100, 0.5, 'call');
        document.getElementById('ivPrice').textContent = price.toFixed(2);
        
        const marker = document.getElementById('ivMarker');
        marker.style.left = ((iv - 10) / 70 * 100) + '%';
      }
      
      slider.addEventListener('input', update);
      update();
    }
  },

  // 卡片13: 二叉树定价简介
  binomialTree: {
    theme: 'purple',
    badge: '进阶',
    title: '二叉树定价模型',
    chapter: '定价原理',
    render: () => `
      <p class="small">另一种直观的期权定价方法</p>
      <div class="binomial-tree">
        <div class="tree-level">
          <div class="tree-node">S₀<br>100</div>
        </div>
        <div class="tree-level">
          <div class="tree-node">Su<br>110</div>
          <div class="tree-node">Sd<br>90</div>
        </div>
        <div class="tree-level">
          <div class="tree-node">Suu<br>121</div>
          <div class="tree-node">Sud<br>99</div>
          <div class="tree-node">Sdd<br>81</div>
        </div>
      </div>
      <div class="example-box">
        <div class="example-title">💡 核心思想</div>
        <p>每一步股价只能涨(u)或跌(d)，从终点的Payoff<b>倒推</b>回来</p>
        <div class="step-list">
          <div class="step"><span class="step-num">1</span><span class="step-content">设定 u=1.1, d=0.9 (涨10%或跌10%)</span></div>
          <div class="step"><span class="step-num">2</span><span class="step-content">在到期日计算每个节点的 Payoff</span></div>
          <div class="step"><span class="step-num">3</span><span class="step-content">用风险中性概率 p 折现回现在</span></div>
        </div>
      </div>
      <div class="formula-box">
        <div class="formula">p = (eʳᵀ - d) / (u - d)</div>
        <div class="formula-desc">风险中性概率</div>
      </div>
    `,
    init: () => {}
  }
};

window.PricingCards = PricingCards;
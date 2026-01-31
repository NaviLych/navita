// ===== 卡片模块：Greeks =====

const GreeksCards = {
  // Greeks 概览
  overview: {
    theme: 'orange',
    badge: 'Greeks',
    title: '希腊字母总览',
    chapter: 'Greeks',
    render: () => `
      <p class="small">期权对各因素的敏感度</p>
      <div class="greeks-summary">
        <div class="greek-card">
          <div class="greek-symbol" style="color:#22c55e">Δ</div>
          <div class="greek-name">Delta</div>
          <div class="greek-value">标的敏感度</div>
        </div>
        <div class="greek-card">
          <div class="greek-symbol" style="color:#3b82f6">Γ</div>
          <div class="greek-name">Gamma</div>
          <div class="greek-value">Delta变化率</div>
        </div>
        <div class="greek-card">
          <div class="greek-symbol" style="color:#ef4444">Θ</div>
          <div class="greek-name">Theta</div>
          <div class="greek-value">时间衰减</div>
        </div>
        <div class="greek-card">
          <div class="greek-symbol" style="color:#a855f7">ν</div>
          <div class="greek-name">Vega</div>
          <div class="greek-value">波动率敏感度</div>
        </div>
      </div>
      <div class="example-box">
        <p>💡 <b>Greeks</b> 帮你理解期权价格变化的原因</p>
        <p class="small">交易前必须了解这些风险指标！</p>
      </div>
    `,
    init: () => {}
  },

  // Delta
  delta: {
    theme: 'orange',
    badge: 'Greeks',
    title: 'Delta (Δ) 速度表',
    chapter: 'Greeks',
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
      <div class="example-box">
        <p>💡 <b>Delta 还可以理解为</b>：期权到期时变成实值的概率（近似）</p>
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

  // Gamma
  gamma: {
    theme: 'blue',
    badge: 'Greeks',
    title: 'Gamma (Γ) 加速度',
    chapter: 'Greeks',
    render: () => `
      <p class="big-text">Delta 变化的<em>速度</em></p>
      <div class="formula-box">
        <div class="formula">Γ = ∂Δ/∂S = ∂²C/∂S²</div>
        <div class="formula-desc">Gamma 是 Delta 对标的价格的导数</div>
      </div>
      <div class="interactive-box">
        <div class="sim-row">
          <label>标的价格 S</label>
          <input type="range" id="gammaS" min="70" max="130" value="100">
          <span id="gammaSVal">100</span>
        </div>
        <div class="result-card">
          <p>Gamma = <span id="gammaVal" class="big-num">0.028</span></p>
          <p class="small">平值期权 Gamma 最大，实值/虚值 Gamma 较小</p>
        </div>
      </div>
      <div class="example-box">
        <p>🚗 把 Delta 想成<b>速度</b>，Gamma 就是<b>加速度</b></p>
        <p class="small">Gamma 高意味着期权价格变化更"敏感"</p>
      </div>
    `,
    init: () => {
      const slider = document.getElementById('gammaS');
      if (!slider) return;
      
      function calcGamma(S, K, r, sigma, T) {
        if (T <= 0) return 0;
        const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        const nd1 = Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI);
        return nd1 / (S * sigma * Math.sqrt(T));
      }
      
      slider.addEventListener('input', () => {
        const S = +slider.value;
        document.getElementById('gammaSVal').textContent = S;
        const gamma = calcGamma(S, 100, 0.03, 0.2, 0.5);
        document.getElementById('gammaVal').textContent = gamma.toFixed(4);
      });
    }
  },

  // Theta
  theta: {
    theme: 'blue',
    badge: 'Greeks',
    title: 'Theta (Θ) 时间杀手',
    chapter: 'Greeks',
    render: () => `
      <p>期权每天都在<strong>贬值</strong>！</p>
      <div class="theta-animation">
        <div class="ice-cube" id="iceCube">🧊</div>
        <p class="small">期权 = 融化的冰块</p>
      </div>
      <div class="interactive-box">
        <div class="sim-row">
          <label>到期天数</label>
          <input type="range" id="thetaDays" min="1" max="90" value="30">
          <span id="thetaDaysVal">30天</span>
        </div>
        <div class="result-card">
          <p>每日时间价值损失 ≈ <span id="thetaVal" class="big-num">-0.05</span> 元</p>
        </div>
      </div>
      <div class="example-box">
        <p><b>Theta = -0.05</b> 意味着：<br>什么都不做，明天你的期权就少值 0.05 元</p>
        <p class="small">💡 越接近到期，Theta 衰减越快！</p>
      </div>
    `,
    init: () => {
      const slider = document.getElementById('thetaDays');
      if (!slider) return;
      
      function calcTheta(S, K, r, sigma, T) {
        if (T <= 0) return 0;
        const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        const d2 = d1 - sigma * Math.sqrt(T);
        const nd1 = Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI);
        const Nd2 = OptionUtils.normCDF(d2);
        return -(S * nd1 * sigma / (2 * Math.sqrt(T))) - r * K * Math.exp(-r * T) * Nd2;
      }
      
      slider.addEventListener('input', () => {
        const days = +slider.value;
        document.getElementById('thetaDaysVal').textContent = days + '天';
        const T = days / 365;
        const theta = calcTheta(100, 100, 0.03, 0.2, T) / 365;
        document.getElementById('thetaVal').textContent = theta.toFixed(3);
      });
    }
  },

  // Vega
  vega: {
    theme: 'green',
    badge: 'Greeks',
    title: 'Vega (ν) 波动率敏感度',
    chapter: 'Greeks',
    render: () => `
      <p>市场越恐慌，期权越值钱</p>
      <div class="vega-visual">
        <div class="wave" id="wave1">〰️〰️〰️</div>
        <div class="wave big" id="wave2">🌊🌊🌊🌊🌊</div>
      </div>
      <div class="interactive-box">
        <div class="sim-row">
          <label>波动率 σ</label>
          <input type="range" id="vegaSigma" min="10" max="60" value="20">
          <span id="vegaSigmaVal">20%</span>
        </div>
        <div class="result-card">
          <p>期权价格 = <span id="vegaPrice" class="big-num">5.88</span> 元</p>
          <p class="small">Vega ≈ <span id="vegaVal">0.20</span></p>
        </div>
      </div>
      <div class="example-box">
        <p><b>波动率从 20% 涨到 30%</b></p>
        <p>如果 Vega = 0.20，期权涨约 <b>0.20 × 10 = 2 元</b></p>
        <p class="small">💡 财报前买期权，就是在赌 Vega！</p>
      </div>
    `,
    init: () => {
      const slider = document.getElementById('vegaSigma');
      if (!slider) return;
      
      function calcVega(S, K, r, sigma, T) {
        if (T <= 0) return 0;
        const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
        const nd1 = Math.exp(-d1 * d1 / 2) / Math.sqrt(2 * Math.PI);
        return S * nd1 * Math.sqrt(T) / 100;
      }
      
      slider.addEventListener('input', () => {
        const sigma = +slider.value;
        document.getElementById('vegaSigmaVal').textContent = sigma + '%';
        const price = OptionUtils.bsPrice(100, 100, 0.03, sigma/100, 0.5, 'call');
        document.getElementById('vegaPrice').textContent = price.toFixed(2);
        const vega = calcVega(100, 100, 0.03, sigma/100, 0.5);
        document.getElementById('vegaVal').textContent = vega.toFixed(2);
      });
    }
  },

  // Rho
  rho: {
    theme: 'purple',
    badge: 'Greeks',
    title: 'Rho (ρ) 利率敏感度',
    chapter: 'Greeks',
    render: () => `
      <p class="big-text">利率变化对期权的影响</p>
      <div class="formula-box">
        <div class="formula">ρ = ∂C/∂r</div>
        <div class="formula-desc">期权价格对无风险利率的敏感度</div>
      </div>
      <div class="interactive-box">
        <div class="sim-row">
          <label>利率 r</label>
          <input type="range" id="rhoR" min="0" max="10" value="3">
          <span id="rhoRVal">3%</span>
        </div>
        <div class="result-card">
          <p>Call 价格 = <span id="rhoCallPrice" class="big-num">5.88</span></p>
          <p>Put 价格 = <span id="rhoPutPrice" class="big-num">4.40</span></p>
        </div>
      </div>
      <div class="example-box">
        <p>💡 <b>利率上升</b>：</p>
        <ul>
          <li>Call 价格上升（持有现金的机会成本增加）</li>
          <li>Put 价格下降</li>
        </ul>
        <p class="small">实际中 Rho 影响通常最小</p>
      </div>
    `,
    init: () => {
      const slider = document.getElementById('rhoR');
      if (!slider) return;
      
      slider.addEventListener('input', () => {
        const r = +slider.value / 100;
        document.getElementById('rhoRVal').textContent = slider.value + '%';
        const callPrice = OptionUtils.bsPrice(100, 100, r, 0.2, 0.5, 'call');
        const putPrice = OptionUtils.bsPrice(100, 100, r, 0.2, 0.5, 'put');
        document.getElementById('rhoCallPrice').textContent = callPrice.toFixed(2);
        document.getElementById('rhoPutPrice').textContent = putPrice.toFixed(2);
      });
    }
  }
};

window.GreeksCards = GreeksCards;
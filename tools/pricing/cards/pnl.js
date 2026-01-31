// ===== 卡片模块：PnL 图表 =====

const PnLCards = {
  // PnL 图
  pnlChart: {
    theme: 'purple',
    badge: '互动',
    title: '盈亏图 (PnL)',
    chapter: '盈亏分析',
    render: () => `
      <div class="chart-container">
        <canvas id="pnlChart"></canvas>
      </div>
      <div class="interactive-box compact">
        <div class="sim-row">
          <label>执行价 K</label>
          <input type="range" id="pnlK" min="80" max="120" value="100">
          <span id="pnlKVal">100</span>
        </div>
        <div class="sim-row">
          <label>权利金</label>
          <input type="range" id="pnlPremium" min="1" max="15" value="5">
          <span id="pnlPremiumVal">5</span>
        </div>
      </div>
    `,
    init: () => {
      let chart = null;
      const kSlider = document.getElementById('pnlK');
      const premSlider = document.getElementById('pnlPremium');
      const kVal = document.getElementById('pnlKVal');
      const premVal = document.getElementById('pnlPremiumVal');

      function draw() {
        const K = +kSlider?.value || 100;
        const premium = +premSlider?.value || 5;
        if (kVal) kVal.textContent = K;
        if (premVal) premVal.textContent = premium;

        const labels = [], data = [];
        for (let p = 60; p <= 140; p += 2) {
          labels.push(p);
          data.push(OptionUtils.payoff(p, K, premium, 'call', 'long'));
        }

        const ctx = document.getElementById('pnlChart')?.getContext('2d');
        if (!ctx) return;

        if (chart) chart.destroy();
        chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Long Call PnL',
              data,
              borderColor: '#667eea',
              backgroundColor: 'rgba(102,126,234,0.1)',
              fill: true,
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#999' } },
              y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#999' } }
            }
          }
        });
      }

      if (kSlider) kSlider.addEventListener('input', draw);
      if (premSlider) premSlider.addEventListener('input', draw);
      setTimeout(draw, 100);
    }
  },

  // 四种基本组合对比
  fourBasics: {
    theme: 'green',
    badge: '核心',
    title: '四种基本头寸',
    chapter: '盈亏分析',
    render: () => `
      <p class="small">期权交易的四个基本方向</p>
      <table class="compare-table">
        <tr>
          <th>头寸</th>
          <th>看法</th>
          <th>最大盈利</th>
          <th>最大亏损</th>
        </tr>
        <tr>
          <td><b>Long Call</b></td>
          <td>看涨📈</td>
          <td>无限</td>
          <td>权利金</td>
        </tr>
        <tr>
          <td><b>Short Call</b></td>
          <td>看不涨📊</td>
          <td>权利金</td>
          <td>无限</td>
        </tr>
        <tr>
          <td><b>Long Put</b></td>
          <td>看跌📉</td>
          <td>K - 权利金</td>
          <td>权利金</td>
        </tr>
        <tr>
          <td><b>Short Put</b></td>
          <td>看不跌📊</td>
          <td>权利金</td>
          <td>K - 权利金</td>
        </tr>
      </table>
      <div class="example-box">
        <p>💡 <b>买方</b>付权利金，亏损有限，收益可能无限</p>
        <p><b>卖方</b>收权利金，收益有限，亏损可能无限</p>
      </div>
    `,
    init: () => {}
  },

  // 盈亏平衡点
  breakeven: {
    theme: 'orange',
    badge: '核心',
    title: '盈亏平衡点',
    chapter: '盈亏分析',
    render: () => `
      <p class="big-text">期权<em>不亏不赚</em>的价格</p>
      <div class="formula-box">
        <div class="formula">Call 盈亏平衡 = K + Premium</div>
        <div class="formula">Put 盈亏平衡 = K - Premium</div>
      </div>
      <div class="interactive-box">
        <div class="sim-grid">
          <label>执行价 K<input type="number" id="beK" value="100"></label>
          <label>权利金<input type="number" id="bePrem" value="5"></label>
          <label>类型<select id="beType"><option value="call">Call</option><option value="put">Put</option></select></label>
        </div>
        <div class="result-card">
          <p>盈亏平衡点 = <span id="beResult" class="big-num">105</span></p>
          <p class="small">股价要<span id="beDirection">超过</span>此价格才能赚钱</p>
        </div>
      </div>
      <div class="example-box">
        <p>📝 <b>例子</b>：买入 K=100 的 Call，付 5 元权利金</p>
        <p>股价需涨到 <b>105</b> 以上才开始盈利</p>
      </div>
    `,
    init: () => {
      const ids = ['beK', 'bePrem', 'beType'];
      
      function update() {
        const K = +document.getElementById('beK')?.value || 100;
        const prem = +document.getElementById('bePrem')?.value || 5;
        const type = document.getElementById('beType')?.value || 'call';
        
        const be = type === 'call' ? K + prem : K - prem;
        document.getElementById('beResult').textContent = be.toFixed(2);
        document.getElementById('beDirection').textContent = type === 'call' ? '超过' : '低于';
      }
      
      ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', update);
      });
      update();
    }
  }
};

window.PnLCards = PnLCards;
// ===== 卡片模块：PnL 图表 (卡片 11) =====

const PnLCards = {
  // 卡片11: PnL 图
  pnlChart: {
    theme: 'purple',
    badge: '互动',
    title: '盈亏图 (PnL)',
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
  }
};

window.PnLCards = PnLCards;
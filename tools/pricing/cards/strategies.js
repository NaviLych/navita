// ===== 卡片模块：策略 (卡片 12) =====

const StrategyCards = {
  // 卡片12: 组合策略
  strategies: {
    theme: 'orange',
    badge: '策略',
    title: '组合策略一览',
    render: () => `
      <div class="strategy-grid">
        <div class="strat-card" data-strat="bullSpread">
          <div class="strat-icon">📈</div>
          <h4>牛市价差</h4>
          <p class="small">温和看涨</p>
        </div>
        <div class="strat-card" data-strat="straddle">
          <div class="strat-icon">↕️</div>
          <h4>跨式</h4>
          <p class="small">赌大波动</p>
        </div>
        <div class="strat-card" data-strat="butterfly">
          <div class="strat-icon">🦋</div>
          <h4>蝶式</h4>
          <p class="small">赌不动</p>
        </div>
        <div class="strat-card" data-strat="ironCondor">
          <div class="strat-icon">🦅</div>
          <h4>铁鹰</h4>
          <p class="small">收租策略</p>
        </div>
      </div>
      <div class="chart-container small">
        <canvas id="stratChart"></canvas>
      </div>
      <p class="small">点击卡片查看该策略的 PnL</p>
    `,
    init: () => {
      let chart = null;
      const cards = document.querySelectorAll('.strat-card');

      function getLegs(strat) {
        const S0 = 100, r = 0.03, sigma = 0.2, T = 0.25;
        const bs = OptionUtils.bsPrice;
        
        switch(strat) {
          case 'bullSpread':
            return [
              { type: 'call', K: 95, side: 'long', premium: bs(S0, 95, r, sigma, T, 'call') },
              { type: 'call', K: 105, side: 'short', premium: bs(S0, 105, r, sigma, T, 'call') }
            ];
          case 'straddle':
            return [
              { type: 'call', K: 100, side: 'long', premium: bs(S0, 100, r, sigma, T, 'call') },
              { type: 'put', K: 100, side: 'long', premium: bs(S0, 100, r, sigma, T, 'put') }
            ];
          case 'butterfly':
            return [
              { type: 'call', K: 90, side: 'long', premium: bs(S0, 90, r, sigma, T, 'call') },
              { type: 'call', K: 100, side: 'short', premium: bs(S0, 100, r, sigma, T, 'call'), qty: 2 },
              { type: 'call', K: 110, side: 'long', premium: bs(S0, 110, r, sigma, T, 'call') }
            ];
          case 'ironCondor':
            return [
              { type: 'put', K: 90, side: 'short', premium: bs(S0, 90, r, sigma, T, 'put') },
              { type: 'put', K: 95, side: 'long', premium: bs(S0, 95, r, sigma, T, 'put') },
              { type: 'call', K: 105, side: 'long', premium: bs(S0, 105, r, sigma, T, 'call') },
              { type: 'call', K: 110, side: 'short', premium: bs(S0, 110, r, sigma, T, 'call') }
            ];
          default:
            return [];
        }
      }

      function draw(strat) {
        const legs = getLegs(strat);
        const labels = [], data = [];
        
        for (let p = 70; p <= 130; p++) {
          labels.push(p);
          let total = 0;
          legs.forEach(leg => {
            const qty = leg.qty || 1;
            total += OptionUtils.payoff(p, leg.K, leg.premium, leg.type, leg.side) * qty;
          });
          data.push(total);
        }

        const ctx = document.getElementById('stratChart')?.getContext('2d');
        if (!ctx) return;

        if (chart) chart.destroy();
        chart = new Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [{
              label: 'Strategy PnL',
              data,
              borderColor: '#fbbf24',
              backgroundColor: 'rgba(251,191,36,0.1)',
              fill: true,
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#999', maxTicksLimit: 7 } },
              y: { grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#999' } }
            }
          }
        });
      }

      cards.forEach(card => {
        card.addEventListener('click', () => {
          cards.forEach(c => c.classList.remove('active'));
          card.classList.add('active');
          draw(card.dataset.strat);
        });
      });

      // 默认选中第一个
      setTimeout(() => {
        if (cards[0]) {
          cards[0].classList.add('active');
          draw('bullSpread');
        }
      }, 100);
    }
  }
};

window.StrategyCards = StrategyCards;
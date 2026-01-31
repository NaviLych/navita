let pnlChart = null;
let params = {};

function updateChart() {
  const { S0, K, premium, type, side } = params;
  const minP = Math.max(1, Math.round(S0 * 0.5));
  const maxP = Math.round(S0 * 1.5);
  const labels = [], data = [];
  for (let p = minP; p <= maxP; p++) {
    labels.push(p);
    data.push(payoff(p, K, premium, type, side));
  }
  if (pnlChart) pnlChart.destroy();
  pnlChart = new Chart(document.getElementById('pnlChart'), {
    type: 'line',
    data: { labels, datasets: [{ label: 'PnL', data, borderColor: '#2a5298', backgroundColor: 'rgba(42,82,152,0.1)', fill: true }] },
    options: { scales: { x: { title: { display: true, text: '到期标的价' } }, y: { title: { display: true, text: 'PnL' } } } }
  });
  // 更新 slider 范围
  const slider = document.getElementById('obsSlider');
  slider.min = minP; slider.max = maxP; slider.value = S0;
  document.getElementById('obsVal').textContent = S0;
  document.getElementById('obsPnL').textContent = payoff(S0, K, premium, type, side).toFixed(2);
}

document.getElementById('plot').addEventListener('click', () => {
  params = {
    S0: +document.getElementById('S0').value,
    K: +document.getElementById('K').value,
    premium: +document.getElementById('premium').value,
    type: document.getElementById('type').value,
    side: document.getElementById('side').value
  };
  updateChart();
});

document.getElementById('obsSlider').addEventListener('input', e => {
  const p = +e.target.value;
  document.getElementById('obsVal').textContent = p;
  if (params.K !== undefined) {
    document.getElementById('obsPnL').textContent = payoff(p, params.K, params.premium, params.type, params.side).toFixed(2);
  }
});

// 初始化
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('plot').click();
});
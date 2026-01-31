let deltaChart = null;

document.getElementById('calc').addEventListener('click', () => {
  const S = +document.getElementById('S').value;
  const K = +document.getElementById('K').value;
  const sigma = +document.getElementById('sigma').value;
  const r = +document.getElementById('r').value;
  const T = +document.getElementById('T').value;
  const type = document.getElementById('type').value;

  const g = bsGreeks(S, K, r, sigma, T, type);
  document.getElementById('delta').textContent = g.delta.toFixed(4);
  document.getElementById('gamma').textContent = g.gamma.toExponential(3);
  document.getElementById('vega').textContent = g.vega.toFixed(4);
  document.getElementById('theta').textContent = g.theta.toFixed(4);
  document.getElementById('rho').textContent = g.rho.toFixed(4);

  // Delta vs S 图
  const prices = [];
  const deltas = [];
  const minS = Math.max(1, Math.round(K * 0.5));
  const maxS = Math.round(K * 1.5);
  for (let p = minS; p <= maxS; p += 1) {
    prices.push(p);
    deltas.push(bsGreeks(p, K, r, sigma, T, type).delta);
  }
  if (deltaChart) deltaChart.destroy();
  deltaChart = new Chart(document.getElementById('deltaChart'), {
    type: 'line',
    data: {
      labels: prices,
      datasets: [{ label: 'Delta', data: deltas, borderColor: '#2a5298', fill: false }]
    },
    options: { scales: { x: { title: { display: true, text: 'S' } }, y: { title: { display: true, text: 'Δ' } } } }
  });
});
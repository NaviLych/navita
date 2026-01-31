let stratChart = null;

function getLegs(strat, S0, K1, K2, K3, sigma, T, r) {
  // 返回 legs 数组: {type, K, side, premium}
  const legs = [];
  if (strat === 'bullCall') {
    legs.push({ type: 'call', K: K1, side: 'long', premium: bsPrice(S0, K1, r, sigma, T, 'call') });
    legs.push({ type: 'call', K: K3, side: 'short', premium: bsPrice(S0, K3, r, sigma, T, 'call') });
  } else if (strat === 'bearPut') {
    legs.push({ type: 'put', K: K3, side: 'long', premium: bsPrice(S0, K3, r, sigma, T, 'put') });
    legs.push({ type: 'put', K: K1, side: 'short', premium: bsPrice(S0, K1, r, sigma, T, 'put') });
  } else if (strat === 'straddle') {
    legs.push({ type: 'call', K: K2, side: 'long', premium: bsPrice(S0, K2, r, sigma, T, 'call') });
    legs.push({ type: 'put', K: K2, side: 'long', premium: bsPrice(S0, K2, r, sigma, T, 'put') });
  } else if (strat === 'butterfly') {
    legs.push({ type: 'call', K: K1, side: 'long', premium: bsPrice(S0, K1, r, sigma, T, 'call') });
    legs.push({ type: 'call', K: K2, side: 'short', premium: bsPrice(S0, K2, r, sigma, T, 'call'), qty: 2 });
    legs.push({ type: 'call', K: K3, side: 'long', premium: bsPrice(S0, K3, r, sigma, T, 'call') });
  }
  return legs;
}

function comboPnL(price, legs) {
  let total = 0;
  for (const leg of legs) {
    const qty = leg.qty || 1;
    total += payoff(price, leg.K, leg.premium, leg.type, leg.side, qty);
  }
  return total;
}

document.getElementById('plot').addEventListener('click', () => {
  const S0 = +document.getElementById('S0').value;
  const K1 = +document.getElementById('K1').value;
  const K2 = +document.getElementById('K2').value;
  const K3 = +document.getElementById('K3').value;
  const sigma = +document.getElementById('sigma').value;
  const T = +document.getElementById('T').value;
  const r = 0.03;
  const strat = document.getElementById('strategy').value;

  const legs = getLegs(strat, S0, K1, K2, K3, sigma, T, r);
  const minP = Math.max(1, Math.round(S0 * 0.6));
  const maxP = Math.round(S0 * 1.4);
  const labels = [], data = [];
  let maxProfit = -Infinity, maxLoss = Infinity;
  for (let p = minP; p <= maxP; p++) {
    labels.push(p);
    const pnl = comboPnL(p, legs);
    data.push(pnl);
    if (pnl > maxProfit) maxProfit = pnl;
    if (pnl < maxLoss) maxLoss = pnl;
  }

  // 净成本 = 多头权利金 - 空头权利金
  let cost = 0;
  for (const leg of legs) {
    const qty = leg.qty || 1;
    cost += (leg.side === 'long' ? leg.premium : -leg.premium) * qty;
  }

  document.getElementById('cost').textContent = cost.toFixed(2);
  document.getElementById('maxProfit').textContent = maxProfit.toFixed(2);
  document.getElementById('maxLoss').textContent = maxLoss.toFixed(2);

  if (stratChart) stratChart.destroy();
  stratChart = new Chart(document.getElementById('stratChart'), {
    type: 'line',
    data: { labels, datasets: [{ label: '组合 PnL', data, borderColor: '#2a5298', backgroundColor: 'rgba(42,82,152,0.1)', fill: true }] },
    options: { scales: { x: { title: { display: true, text: '到期标的价' } }, y: { title: { display: true, text: 'PnL' } } } }
  });
});

window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('plot').click();
});
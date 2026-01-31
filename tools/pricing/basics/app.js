document.getElementById('calc').addEventListener('click', () => {
  const S = +document.getElementById('S').value;
  const K = +document.getElementById('K').value;
  const premium = +document.getElementById('premium').value;
  const type = document.getElementById('type').value;
  const side = document.getElementById('side').value;

  const intrinsic = type === 'call' ? Math.max(S - K, 0) : Math.max(K - S, 0);
  const payoffLong = intrinsic;
  const payoffShort = -intrinsic;
  const pnlLong = intrinsic - premium;
  const pnlShort = premium - intrinsic;

  document.getElementById('intrinsic').textContent = intrinsic.toFixed(2);
  document.getElementById('payoff').textContent = (side === 'long' ? payoffLong : payoffShort).toFixed(2);
  document.getElementById('pnl').textContent = (side === 'long' ? pnlLong : pnlShort).toFixed(2);
});
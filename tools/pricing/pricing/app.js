document.getElementById('calc').addEventListener('click', () => {
  const S = +document.getElementById('S').value;
  const K = +document.getElementById('K').value;
  const sigma = +document.getElementById('sigma').value;
  const r = +document.getElementById('r').value;
  const T = +document.getElementById('T').value;
  const type = document.getElementById('type').value;
  const price = bsPrice(S, K, r, sigma, T, type);
  document.getElementById('price').textContent = price.toFixed(4);
});
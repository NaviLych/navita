// ===== 核心工具函数：BS定价、Greeks =====

// 正态分布 CDF
function normCDF(x) {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  let prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

// Black-Scholes 定价
function bsPrice(S, K, r, sigma, T, type) {
  if (T <= 0) return Math.max(type === 'call' ? S - K : K - S, 0);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  const d2 = d1 - sigma * Math.sqrt(T);
  return type === 'call'
    ? S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2)
    : K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
}

// Delta 计算
function bsDelta(S, K, r, sigma, T, type) {
  if (T <= 0) return type === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0);
  const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
  return type === 'call' ? normCDF(d1) : normCDF(d1) - 1;
}

// 到期 Payoff
function payoff(price, K, premium, type, side) {
  const intrinsic = type === 'call' ? Math.max(price - K, 0) : Math.max(K - price, 0);
  return side === 'long' ? intrinsic - premium : premium - intrinsic;
}

// 导出到全局
window.OptionUtils = { normCDF, bsPrice, bsDelta, payoff };
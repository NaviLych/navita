// ===== 公共工具函数 =====

// 正态分布 CDF (Abramowitz & Stegun)
function normCDF(x){
  const t=1/(1+0.2316419*Math.abs(x));
  const d=0.3989423*Math.exp(-x*x/2);
  let prob=d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));
  return x>0?1-prob:prob;
}
function normPDF(x){return Math.exp(-0.5*x*x)/Math.sqrt(2*Math.PI)}

// Black-Scholes 定价
function bsPrice(S,K,r,sigma,T,type){
  if(T<=0)return Math.max(type==='call'?S-K:K-S,0);
  const d1=(Math.log(S/K)+(r+0.5*sigma*sigma)*T)/(sigma*Math.sqrt(T));
  const d2=d1-sigma*Math.sqrt(T);
  return type==='call'
    ? S*normCDF(d1)-K*Math.exp(-r*T)*normCDF(d2)
    : K*Math.exp(-r*T)*normCDF(-d2)-S*normCDF(-d1);
}

// Greeks
function bsGreeks(S,K,r,sigma,T,type){
  if(T<=0)return{delta:type==='call'?(S>K?1:0):(S<K?-1:0),gamma:0,vega:0,theta:0,rho:0};
  const sqrtT=Math.sqrt(T);
  const d1=(Math.log(S/K)+(r+0.5*sigma*sigma)*T)/(sigma*sqrtT);
  const d2=d1-sigma*sqrtT;
  const pdf_d1=normPDF(d1);
  const delta=type==='call'?normCDF(d1):normCDF(d1)-1;
  const gamma=pdf_d1/(S*sigma*sqrtT);
  const vega=S*pdf_d1*sqrtT/100; // 每 1% 波动率
  const thetaCall=-(S*pdf_d1*sigma)/(2*sqrtT)-r*K*Math.exp(-r*T)*normCDF(d2);
  const thetaPut=-(S*pdf_d1*sigma)/(2*sqrtT)+r*K*Math.exp(-r*T)*normCDF(-d2);
  const theta=(type==='call'?thetaCall:thetaPut)/365;
  const rho=(type==='call'?K*T*Math.exp(-r*T)*normCDF(d2):-K*T*Math.exp(-r*T)*normCDF(-d2))/100;
  return{delta,gamma,vega,theta,rho};
}

// 到期 Payoff（单腿）
function payoff(price,K,premium,type,side,qty=1){
  const intrinsic=type==='call'?Math.max(price-K,0):Math.max(K-price,0);
  return side==='long'?(intrinsic-premium)*qty:(premium-intrinsic)*qty;
}

// 移动端模拟器折叠
document.addEventListener('DOMContentLoaded',()=>{
  document.querySelectorAll('.sim-toggle').forEach(toggle=>{
    toggle.addEventListener('click',()=>{
      toggle.closest('.sim-panel').classList.toggle('collapsed');
    });
  });
});

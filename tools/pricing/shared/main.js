// ===== 主应用：卡片渲染与滑动控制 =====

document.addEventListener('DOMContentLoaded', () => {
  // 合并所有卡片
  const allCards = [
    BasicsCards.whatIsOption,
    BasicsCards.callVsPut,
    BasicsCards.longVsShort,
    PremiumCards.premium,
    PremiumCards.expiryPnL,
    PricingCards.factors,
    PricingCards.bsCalculator,
    GreeksCards.delta,
    GreeksCards.theta,
    GreeksCards.vega,
    PnLCards.pnlChart,
    StrategyCards.strategies
  ];

  // 渲染卡片
  const wrapper = document.querySelector('.cards-wrapper');
  allCards.forEach((card, idx) => {
    const section = document.createElement('section');
    section.className = 'card';
    section.dataset.theme = card.theme;
    section.dataset.index = idx;
    section.innerHTML = `
      <div class="card-content">
        <div class="card-badge">${card.badge}</div>
        <h1>${card.title}</h1>
        ${card.render()}
      </div>
    `;
    wrapper.appendChild(section);
  });

  // 初始化交互
  allCards.forEach(card => card.init());

  // 进度更新
  const progressFill = document.querySelector('.progress-fill');
  const currentSpan = document.querySelector('.current');
  const totalSpan = document.querySelector('.total');
  totalSpan.textContent = allCards.length;

  function updateProgress() {
    const scrollTop = wrapper.scrollTop;
    const cardHeight = window.innerHeight;
    const idx = Math.round(scrollTop / cardHeight) + 1;
    currentSpan.textContent = idx;
    progressFill.style.width = (idx / allCards.length * 100) + '%';
  }

  wrapper.addEventListener('scroll', updateProgress);

  // 键盘导航
  document.addEventListener('keydown', (e) => {
    const h = window.innerHeight;
    if (e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault();
      wrapper.scrollBy({ top: h, behavior: 'smooth' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      wrapper.scrollBy({ top: -h, behavior: 'smooth' });
    }
  });
});
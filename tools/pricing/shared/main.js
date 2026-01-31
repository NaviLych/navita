// ===== 主应用：卡片渲染与滑动控制 =====

document.addEventListener('DOMContentLoaded', () => {
  // 定义章节和卡片
  const chapters = [
    {
      name: '基础入门',
      cards: [
        BasicsCards.whatIsOption,
        BasicsCards.callVsPut,
        BasicsCards.longVsShort,
        BasicsCards.terminology
      ]
    },
    {
      name: '权利金与盈亏',
      cards: [
        PremiumCards.premium,
        PremiumCards.expiryPnL
      ]
    },
    {
      name: '定价原理',
      cards: [
        PricingCards.factors,
        PricingCards.bsFormula,
        PricingCards.bsCalculator,
        PricingCards.putCallParity,
        PricingCards.parityCalculator,
        PricingCards.intrinsicTime,
        PricingCards.impliedVol,
        PricingCards.binomialTree
      ]
    },
    {
      name: 'Greeks',
      cards: [
        GreeksCards.overview,
        GreeksCards.delta,
        GreeksCards.gamma,
        GreeksCards.theta,
        GreeksCards.vega,
        GreeksCards.rho
      ]
    },
    {
      name: '盈亏分析',
      cards: [
        PnLCards.pnlChart,
        PnLCards.fourBasics,
        PnLCards.breakeven
      ]
    },
    {
      name: '交易策略',
      cards: [
        StrategyCards.strategies
      ]
    }
  ];

  // 扁平化所有卡片
  const allCards = chapters.flatMap(ch => ch.cards);

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

  // 创建章节导航
  const nav = document.createElement('nav');
  nav.className = 'chapter-nav';
  
  let cardIndex = 0;
  chapters.forEach((chapter, chIdx) => {
    const startIdx = cardIndex;
    chapter.cards.forEach((card, cIdx) => {
      const dot = document.createElement('div');
      dot.className = 'chapter-dot';
      dot.dataset.index = cardIndex;
      dot.dataset.label = `${chapter.name} - ${card.title}`;
      dot.title = card.title;
      
      dot.addEventListener('click', () => {
        const targetIdx = parseInt(dot.dataset.index);
        wrapper.scrollTo({
          top: targetIdx * window.innerHeight,
          behavior: 'smooth'
        });
      });
      
      nav.appendChild(dot);
      cardIndex++;
    });
  });
  
  document.querySelector('.app').appendChild(nav);

  // 初始化交互
  allCards.forEach(card => card.init());

  // 进度更新
  const progressFill = document.querySelector('.progress-fill');
  const currentSpan = document.querySelector('.current');
  const totalSpan = document.querySelector('.total');
  const dots = document.querySelectorAll('.chapter-dot');
  totalSpan.textContent = allCards.length;

  function updateProgress() {
    const scrollTop = wrapper.scrollTop;
    const cardHeight = window.innerHeight;
    const idx = Math.round(scrollTop / cardHeight);
    const displayIdx = idx + 1;
    currentSpan.textContent = displayIdx;
    progressFill.style.width = (displayIdx / allCards.length * 100) + '%';
    
    // 更新章节指示器
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
    });
  }

  wrapper.addEventListener('scroll', updateProgress);
  updateProgress(); // 初始化

  // 键盘导航
  document.addEventListener('keydown', (e) => {
    const h = window.innerHeight;
    if (e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault();
      wrapper.scrollBy({ top: h, behavior: 'smooth' });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      wrapper.scrollBy({ top: -h, behavior: 'smooth' });
    } else if (e.key === 'Home') {
      e.preventDefault();
      wrapper.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (e.key === 'End') {
      e.preventDefault();
      wrapper.scrollTo({ top: wrapper.scrollHeight, behavior: 'smooth' });
    }
  });

  // 数字键快速跳转章节
  document.addEventListener('keydown', (e) => {
    const num = parseInt(e.key);
    if (num >= 1 && num <= chapters.length) {
      let targetIdx = 0;
      for (let i = 0; i < num - 1; i++) {
        targetIdx += chapters[i].cards.length;
      }
      wrapper.scrollTo({
        top: targetIdx * window.innerHeight,
        behavior: 'smooth'
      });
    }
  });
});
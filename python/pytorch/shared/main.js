// ===== 主应用：卡片渲染与滑动控制 =====

document.addEventListener('DOMContentLoaded', () => {
  const chapters = [
    {
      name: '基础入门',
      cards: [
        BasicsCards.whatIsPyTorch,
        BasicsCards.installation,
        BasicsCards.firstTensor
      ]
    },
    {
      name: '张量操作',
      cards: [
        TensorCards.creation,
        TensorCards.operations,
        TensorCards.indexing,
        TensorCards.reshaping
      ]
    },
    {
      name: '自动微分',
      cards: [
        AutogradCards.concept,
        AutogradCards.computeGraph,
        AutogradCards.practice
      ]
    },
    {
      name: '神经网络',
      cards: [
        NNCards.moduleBasics,
        NNCards.commonLayers,
        NNCards.activations,
        NNCards.lossAndOptim
      ]
    },
    {
      name: '数据处理',
      cards: [
        DataCards.datasetLoader,
        DataCards.transforms,
        DataCards.customDataset
      ]
    },
    {
      name: '训练流程',
      cards: [
        TrainingCards.trainLoop,
        TrainingCards.validation,
        TrainingCards.saveLoad
      ]
    },
    {
      name: 'CNN图像',
      cards: [
        CNNCards.convPrinciple,
        CNNCards.buildCNN,
        CNNCards.cifar10
      ]
    },
    {
      name: 'RNN序列',
      cards: [
        RNNCards.rnnPrinciple,
        RNNCards.textClassify,
        RNNCards.timeSeries
      ]
    },
    {
      name: '进阶技巧',
      cards: [
        AdvancedCards.transferLearning,
        AdvancedCards.gpuAccel,
        AdvancedCards.regularization
      ]
    },
    {
      name: '实战项目',
      cards: [
        ProjectCards.mnistProject,
        ProjectCards.sentimentProject
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
  chapters.forEach((chapter) => {
    chapter.cards.forEach((card) => {
      const dot = document.createElement('div');
      dot.className = 'chapter-dot';
      dot.dataset.index = cardIndex;
      dot.dataset.label = `${chapter.name} · ${card.title}`;
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

    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === idx);
    });
  }

  wrapper.addEventListener('scroll', updateProgress);
  updateProgress();

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

    // 数字键快速跳转章节
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

const modules = [
  {
    id: 'partners',
    icon: '🤝',
    name: '关键合作',
    english: 'Key Partners',
    hint: '关键供应商和合作伙伴识别',
    prompt: '列出你必须依赖的外部伙伴、供应商、渠道方或生态资源，并说明他们为什么关键。',
    questions: ['谁能帮助你降低风险、成本或获取稀缺能力？', '哪些活动或资源必须外部协同完成？', '合作关系是否可替代，议价权在谁手里？']
  },
  {
    id: 'activities',
    icon: '⚙️',
    name: '关键活动',
    english: 'Key Activities',
    hint: '核心业务活动类型判断',
    prompt: '描述让价值主张持续成立的核心动作，例如研发、运营、交付、获客、风控或服务。',
    questions: ['哪些活动直接决定客户体验或收入结果？', '活动之间是否形成可重复流程？', '哪些活动越做越强，哪些会成为瓶颈？']
  },
  {
    id: 'resources',
    icon: '💎',
    name: '核心资源',
    english: 'Key Resources',
    hint: '资源类型与稀缺性分析',
    prompt: '识别你拥有或需要控制的关键资产：技术、数据、品牌、资质、团队、资金或网络。',
    questions: ['哪些资源是竞争者短期难以复制的？', '资源如何支撑关键活动和价值主张？', '资源获取与维护成本是否可承受？']
  },
  {
    id: 'value',
    icon: '✦',
    name: '价值主张',
    english: 'Value Proposition',
    hint: '痛点、差异化、付费意愿',
    prompt: '用具体场景描述你解决了什么痛点、带来什么收益，以及为什么客户会选择你而不是替代方案。',
    questions: ['核心痛点是什么，你如何解决？', '与竞品或现有做法的差异化在哪里？', '客户愿意为哪个具体价值买单？']
  },
  {
    id: 'relations',
    icon: '💬',
    name: '客户关系',
    english: 'Customer Relations',
    hint: '关系类型与升级路径',
    prompt: '说明你如何获得、服务、留住并升级客户关系，是自助、顾问式、社区、会员还是长期陪伴。',
    questions: ['客户从首次接触到忠诚复购经历哪些阶段？', '关系维护依赖人力还是产品机制？', '如何让客户贡献反馈、案例或转介绍？']
  },
  {
    id: 'channels',
    icon: '📡',
    name: '渠道通路',
    english: 'Channels',
    hint: '触达效率与成本结构',
    prompt: '写下客户如何认识、评估、购买、使用和获得售后支持，关注渠道效率与获客成本。',
    questions: ['目标客户最集中的触达场景在哪里？', '渠道是否与客群决策习惯匹配？', '渠道成本、转化率和可规模化程度如何？']
  },
  {
    id: 'segments',
    icon: '👥',
    name: '客户细分',
    english: 'Customer Segments',
    hint: '画像、维度、优先级',
    prompt: '定义最优先服务的人群或组织，明确他们的场景、预算、决策链、痛点强度和规模。',
    questions: ['你的早期核心客户是谁，而不是泛泛所有人？', '他们有什么共同的行为、预算或任务特征？', '为什么这个细分市场应优先进入？']
  },
  {
    id: 'costs',
    icon: '📊',
    name: '成本结构',
    english: 'Cost Structure',
    hint: '固定/可变成本与规模效应',
    prompt: '拆解固定成本、可变成本、边际成本和关键成本驱动因素，判断规模扩大后成本是否优化。',
    questions: ['哪些成本随客户或交易量线性增长？', '哪些投入是前期固定成本或沉没成本？', '规模效应会降低成本，还是服务复杂度会吞噬利润？']
  },
  {
    id: 'revenue',
    icon: '💰',
    name: '收入来源',
    english: 'Revenue Streams',
    hint: '收入模式、定价策略、可持续性',
    prompt: '说明谁付费、为什么付费、按什么方式付费，以及收入是否可预测、可复购、可扩张。',
    questions: ['收入来自订阅、交易、授权、广告、服务还是组合？', '定价锚点与客户感知价值是否一致？', '收入增长依赖新增客户、留存升级还是使用量提升？']
  }
];

const insightKeywords = ['壁垒', '飞轮', '网络效应', '锁定', '护城河', '颠覆', '痛点', '场景', '假设', '验证', '迭代', '反馈', '闭环', '杠杆', '稀缺', '边际', '复用'];
const insightKeywordTarget = 8;
const maxExportFilenameLength = 120;
const scoreWeights = {
  completeness: 0.3,
  depth: 0.3,
  coherence: 0.25,
  insight: 0.15
};
const coherencePairs = [
  ['value', 'segments', '价值主张 ↔ 客户细分'],
  ['value', 'revenue', '价值主张 ↔ 收入来源'],
  ['segments', 'channels', '客户细分 ↔ 渠道通路']
];

const state = {
  view: 'canvas',
  activeModuleId: modules[0].id,
  projectName: '未命名商业模式',
  entries: Object.fromEntries(modules.map(item => [item.id, '']))
};

const storageKey = 'bmc-studio-state-v1';
const app = document.getElementById('app');

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!saved || typeof saved !== 'object') return;
    if (typeof saved.projectName === 'string') state.projectName = saved.projectName;
    if (saved.entries && typeof saved.entries === 'object') {
      modules.forEach(item => {
        if (typeof saved.entries[item.id] === 'string') state.entries[item.id] = saved.entries[item.id];
      });
    }
  } catch (error) {
    console.warn('BMC Studio saved data could not be loaded and was reset.', error);
    localStorage.removeItem(storageKey);
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify({
    projectName: state.projectName,
    entries: state.entries
  }));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function getSafeExportFilename(projectName) {
  const sanitizedName = projectName.replace(/[\\/:*?"<>|]+/g, '').trim();
  return (sanitizedName || 'bmc-report').slice(0, maxExportFilenameLength);
}

function textLength(value) {
  return value.replace(/\s/g, '').length;
}

function getDepthScore(length) {
  if (length === 0) return 0;
  if (length < 20) return 30;
  if (length < 60) return 55;
  if (length < 120) return 75;
  if (length < 200) return 90;
  return 100;
}

function calculateScores() {
  const lengths = modules.map(item => textLength(state.entries[item.id]));
  const filledCount = lengths.filter(length => length > 0).length;
  const completeness = Math.round((filledCount / modules.length) * 100);
  const depth = Math.round(lengths.reduce((sum, length) => sum + getDepthScore(length), 0) / modules.length);
  const coherenceHits = coherencePairs.filter(([left, right]) => textLength(state.entries[left]) >= 20 && textLength(state.entries[right]) >= 20).length;
  const coherence = Math.round((coherenceHits / coherencePairs.length) * 100);
  const allText = Object.values(state.entries).join('\n');
  const keywordHits = insightKeywords.filter(keyword => allText.includes(keyword)).length;
  const insight = Math.min(100, Math.round((keywordHits / insightKeywordTarget) * 100));
  const total = Math.round(
    completeness * scoreWeights.completeness +
    depth * scoreWeights.depth +
    coherence * scoreWeights.coherence +
    insight * scoreWeights.insight
  );
  const grade = getGrade(total);

  return { completeness, depth, coherence, insight, total, grade, filledCount, keywordHits, coherenceHits };
}

function getGrade(total) {
  if (total >= 90) return { label: 'S', text: '商业直觉敏锐' };
  if (total >= 75) return { label: 'A', text: '框架扎实，有深度' };
  if (total >= 60) return { label: 'B', text: '基础完整，可深挖' };
  if (total >= 40) return { label: 'C', text: '骨架初现，继续补充' };
  return { label: 'D', text: '刚刚起步，大胆填写' };
}

function getSuggestions(scores) {
  const suggestions = [];
  if (scores.completeness < 80) suggestions.push('还有模块未填写，试着把 9 个模块都覆盖一遍，即使只写几个关键词也好过空白。');
  if (scores.depth < 60) suggestions.push('部分模块内容偏少，试着针对每个引导问题展开回答，至少写 2-3 个要点。');
  if (scores.coherence < 70) suggestions.push('检查价值主张与客户细分是否对齐——你解决的问题真的是目标客户最痛的点吗？');
  if (scores.insight < 60) suggestions.push('试着加入更深层的思考：护城河在哪？飞轮效应如何形成？竞争者进入后你的壁垒是什么？');
  if (!suggestions.length) suggestions.push('框架已经很扎实了！下一步可以做竞品对比画布，或者模拟投资人的质疑来压力测试。');
  return suggestions;
}

function setView(view, moduleId) {
  state.view = view;
  if (moduleId) state.activeModuleId = moduleId;
  render();
}

function render() {
  const scores = calculateScores();
  app.innerHTML = `
    <header class="topbar">
      <div>
        <p class="eyebrow">BMC Studio</p>
        <h1>商业模式画布练习工坊</h1>
      </div>
      <div class="topbar-actions">
        <button class="ghost-btn" data-action="canvas">画布</button>
        <button class="ghost-btn" data-action="score">评分</button>
      </div>
    </header>
    <main class="view-host">
      ${state.view === 'score' ? renderScore(scores) : state.view === 'edit' ? renderEditor(scores) : renderCanvas(scores)}
    </main>
  `;
  bindEvents();
}

function renderCanvas(scores) {
  const progress = Math.round((scores.filledCount / modules.length) * 100);
  return `
    <section class="hero-panel">
      <div class="project-field">
        <label for="projectName">项目名称</label>
        <input id="projectName" type="text" value="${escapeHtml(state.projectName)}" placeholder="如：面向中小银行的 FpML 合规 SaaS">
      </div>
      <div class="score-chip" aria-label="当前评分">
        <span>${scores.grade.label}</span>
        <strong>${scores.total}</strong>
        <small>${scores.grade.text}</small>
      </div>
    </section>
    <section class="progress-panel">
      <div class="progress-copy">
        <strong>填写进度 ${scores.filledCount}/9</strong>
        <span>${progress}% · 完整度 ${scores.completeness} · 深度 ${scores.depth}</span>
      </div>
      <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
    </section>
    <section class="canvas-grid">
      ${modules.map(item => renderModuleCard(item)).join('')}
    </section>
  `;
}

function renderModuleCard(item) {
  const content = state.entries[item.id];
  const length = textLength(content);
  const filled = length > 0;
  const preview = filled ? escapeHtml(content.slice(0, 76)) : '点击填写…';
  return `
    <article class="module-card ${filled ? 'is-filled' : ''}" data-module="${item.id}" tabindex="0">
      <div class="module-mark">${item.icon}</div>
      <div class="module-body">
        <div class="module-title-row">
          <h2>${item.name}</h2>
          <span>${filled ? '✓' : item.english}</span>
        </div>
        <p class="module-hint">${item.hint}</p>
        <p class="module-preview">${preview}${filled && content.length > 76 ? '…' : ''}</p>
      </div>
    </article>
  `;
}

function renderEditor(scores) {
  const item = modules.find(module => module.id === state.activeModuleId) || modules[0];
  return `
    <section class="editor-shell">
      <button class="back-btn" data-action="canvas">← 返回画布</button>
      <div class="editor-card">
        <div class="editor-heading">
          <span class="editor-icon">${item.icon}</span>
          <div>
            <p class="eyebrow">${item.english}</p>
            <h2>${item.name}</h2>
            <p>${item.prompt}</p>
          </div>
        </div>
        <div class="hint-box">${item.hint}</div>
        <textarea id="moduleText" rows="12" placeholder="围绕提示自由填写，尽量写出因果关系、关键假设和验证方式。">${escapeHtml(state.entries[item.id])}</textarea>
        <div class="editor-meta">
          <span>${textLength(state.entries[item.id])} 字 · 深度 ${getDepthScore(textLength(state.entries[item.id]))}</span>
          <span>实时总分 ${scores.total}</span>
        </div>
      </div>
      <aside class="question-card">
        <h3>自检问题</h3>
        <ol>
          ${item.questions.map(question => `<li>${question}</li>`).join('')}
        </ol>
      </aside>
    </section>
  `;
}

function renderScore(scores) {
  const suggestions = getSuggestions(scores);
  const dimensions = [
    ['完整度', 'Completeness', scores.completeness, '已填写模块数 / 9，覆盖面是基本功'],
    ['深度', 'Depth', scores.depth, '根据内容长度梯度评分，鼓励展开关键逻辑'],
    ['一致性', 'Coherence', scores.coherence, '检测价值主张、客户细分、收入和渠道之间的逻辑连接'],
    ['洞察力', 'Insight', scores.insight, `命中 ${scores.keywordHits} 个深层思考关键词`]
  ];

  return `
    <section class="score-layout">
      <div class="score-summary">
        <div class="score-ring" style="--score:${scores.total * 3.6}deg">
          <div>
            <span>${scores.grade.label}</span>
            <strong>${scores.total}</strong>
          </div>
        </div>
        <h2>${scores.grade.text}</h2>
        <p>综合评分 = 完整度 × 30% + 深度 × 30% + 一致性 × 25% + 洞察力 × 15%</p>
        <div class="score-actions">
          <button class="primary-btn" data-action="export">导出 HTML 报告</button>
          <button class="ghost-btn" data-action="canvas">继续完善</button>
        </div>
      </div>
      <div class="score-detail">
        <div class="dimension-grid">
          ${dimensions.map(([name, english, value, desc]) => `
            <article class="dimension-card">
              <div>
                <span>${english}</span>
                <strong>${name}</strong>
              </div>
              <b>${value}</b>
              <div class="mini-track"><i style="width:${value}%"></i></div>
              <p>${desc}</p>
            </article>
          `).join('')}
        </div>
        <div class="suggestion-card">
          <h3>改进建议</h3>
          <ul>${suggestions.map(item => `<li>${item}</li>`).join('')}</ul>
        </div>
        <div class="connection-card">
          <h3>关键连接</h3>
          ${coherencePairs.map(([left, right, label]) => {
            const passed = textLength(state.entries[left]) >= 20 && textLength(state.entries[right]) >= 20;
            return `<p class="connection ${passed ? 'passed' : ''}"><span>${passed ? '✓' : '·'}</span>${label}</p>`;
          }).join('')}
        </div>
      </div>
    </section>
  `;
}

function bindEvents() {
  app.querySelectorAll('[data-action="canvas"]').forEach(button => button.addEventListener('click', () => setView('canvas')));
  app.querySelectorAll('[data-action="score"]').forEach(button => button.addEventListener('click', () => setView('score')));
  app.querySelectorAll('[data-action="export"]').forEach(button => button.addEventListener('click', exportReport));

  const projectInput = document.getElementById('projectName');
  if (projectInput) {
    projectInput.addEventListener('input', event => {
      state.projectName = event.target.value || '未命名商业模式';
      saveState();
    });
  }

  app.querySelectorAll('.module-card').forEach(card => {
    const open = () => setView('edit', card.dataset.module);
    card.addEventListener('click', open);
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        open();
      }
    });
  });

  const textarea = document.getElementById('moduleText');
  if (textarea) {
    textarea.focus();
    textarea.addEventListener('input', event => {
      state.entries[state.activeModuleId] = event.target.value;
      saveState();
      const meta = app.querySelector('.editor-meta');
      if (meta) {
        const scores = calculateScores();
        const length = textLength(event.target.value);
        meta.innerHTML = `<span>${length} 字 · 深度 ${getDepthScore(length)}</span><span>实时总分 ${scores.total}</span>`;
      }
    });
  }
}

function exportReport() {
  const scores = calculateScores();
  const suggestions = getSuggestions(scores);
  const now = new Date().toLocaleString('zh-CN');
  const moduleHtml = modules.map(item => `
    <section class="module">
      <h2>${item.icon} ${escapeHtml(item.name)} <small>${escapeHtml(item.english)}</small></h2>
      <p>${escapeHtml(state.entries[item.id] || '未填写')}</p>
    </section>
  `).join('');
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(state.projectName)} · BMC 报告</title>
  <style>
    body{margin:0;background:#141414;color:#e8e4df;font-family:Georgia,'Noto Serif SC',serif;line-height:1.7;padding:32px}main{max-width:920px;margin:auto}.hero,.module{background:#252525;border:1px solid #333;border-radius:20px;padding:24px;margin:18px 0}.module p{white-space:pre-wrap}.grade{color:#d4af37;font-size:64px;line-height:1}h1,h2{margin:0 0 12px}small{color:#888;font-size:14px}.scores{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}.score{background:#1b1b1b;border-radius:14px;padding:16px}.score b{display:block;color:#d4af37;font-size:28px}.suggestions li{margin:8px 0}@media print{body{background:#fff;color:#111}.hero,.module,.score{border-color:#ddd;background:#fff}.grade,.score b{color:#8a6500}}
  </style>
</head>
<body>
  <main>
    <section class="hero">
      <small>导出时间：${escapeHtml(now)}</small>
      <h1>${escapeHtml(state.projectName)}</h1>
      <div class="grade">${scores.grade.label}</div>
      <p>综合评分 ${scores.total} · ${scores.grade.text}</p>
      <div class="scores">
        <div class="score"><span>完整度</span><b>${scores.completeness}</b></div>
        <div class="score"><span>深度</span><b>${scores.depth}</b></div>
        <div class="score"><span>一致性</span><b>${scores.coherence}</b></div>
        <div class="score"><span>洞察力</span><b>${scores.insight}</b></div>
      </div>
      <ul class="suggestions">${suggestions.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
    </section>
    ${moduleHtml}
  </main>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = getSafeExportFilename(state.projectName);
  link.href = url;
  link.download = `${safeName}-BMC报告.html`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

loadState();
render();

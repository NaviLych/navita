// ===== 卡片模块：基础入门 =====

const BasicsCards = {
  // 卡片: 什么是 LangChain
  whatIsLangChain: {
    theme: 'purple',
    badge: '入门',
    title: '什么是 LangChain？',
    render: () => `
      <p class="big-text">一个用于构建<em>大语言模型（LLM）应用</em>的<strong>开源框架</strong>，让 AI 应用开发变得简单高效</p>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feat-icon">🔗</div>
          <h4>链式组合</h4>
          <p>将 LLM 调用像积木一样拼接</p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">🧠</div>
          <h4>记忆系统</h4>
          <p>让对话具有上下文记忆</p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">🔍</div>
          <h4>RAG 检索</h4>
          <p>结合私有数据增强 LLM</p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">🤖</div>
          <h4>智能体</h4>
          <p>Agent 自主决策调用工具</p>
        </div>
      </div>
      <div class="tip-box">
        💡 LangChain 的核心理念：<b>不要重复造轮子，用标准化组件构建 LLM 应用</b>
      </div>
      <div class="swipe-hint">↑ 上滑继续</div>
    `,
    init: () => {}
  },

  // 卡片: 安装与配置
  installation: {
    theme: 'blue',
    badge: '入门',
    title: '安装与环境配置',
    render: () => `
      <p class="big-text">三步搭建 LangChain 开发环境</p>
      <div class="step-list">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-content">
            <b>安装核心包</b><br>
            langchain + langchain-openai
          </div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-content">
            <b>配置 API Key</b><br>
            设置环境变量或 .env 文件
          </div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-content">
            <b>验证安装</b><br>
            发送第一个请求
          </div>
        </div>
      </div>
      <div class="code-block"><span class="code-label">Terminal</span><code><span class="cmt"># 安装核心包</span>
pip install langchain langchain-openai

<span class="cmt"># 安装常用扩展</span>
pip install langchain-community faiss-cpu

<span class="cmt"># 安装 dotenv 管理密钥</span>
pip install python-dotenv</code></div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">import</span> os
<span class="kw">from</span> dotenv <span class="kw">import</span> load_dotenv

load_dotenv()  <span class="cmt"># 从 .env 文件加载</span>

<span class="cmt"># .env 文件内容：</span>
<span class="cmt"># OPENAI_API_KEY=sk-xxx...</span>

<span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI
llm = <span class="cls">ChatOpenAI</span>(model=<span class="str">"gpt-4o-mini"</span>)
response = llm.invoke(<span class="str">"你好，LangChain！"</span>)
print(response.content)</code></div>
      <div class="warn-box">
        ⚠️ 请勿将 API Key 硬编码到代码中，始终使用环境变量或 .env 文件管理
      </div>
    `,
    init: () => {}
  },

  // 卡片: 核心架构
  coreArchitecture: {
    theme: 'teal',
    badge: '入门',
    title: 'LangChain 核心架构',
    render: () => `
      <p class="big-text">六大核心模块，<em>模块化设计</em>按需组合</p>
      <div class="arch-stack">
        <div class="arch-layer top">🤖 Agents — 智能体（自主决策 + 工具调用）</div>
        <div class="arch-layer mid">🔗 Chains / LCEL — 链式调用（组合多个步骤）</div>
        <div class="arch-layer bot">🧠 Memory — 记忆（上下文管理）</div>
        <div class="arch-layer base">📄 Retrieval — 检索（RAG / 向量数据库）</div>
      </div>
      <div class="arch-stack">
        <div class="arch-layer mid">📝 Prompts — 提示词模板</div>
        <div class="arch-layer bot">🔮 Models — LLM / Chat / Embedding 模型</div>
      </div>
      <div class="example-box">
        <div class="example-title">📦 包的拆分（v0.2+）</div>
        <ul>
          <li><b>langchain-core</b> — 核心抽象与 LCEL</li>
          <li><b>langchain</b> — 通用链、Agent 逻辑</li>
          <li><b>langchain-openai</b> — OpenAI 集成</li>
          <li><b>langchain-community</b> — 社区集成</li>
          <li><b>langgraph</b> — 多 Agent 编排</li>
        </ul>
      </div>
    `,
    init: () => {}
  }
};

window.BasicsCards = BasicsCards;

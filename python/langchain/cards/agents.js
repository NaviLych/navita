// ===== 卡片模块：智能体 Agent =====

const AgentCards = {
  // 什么是 Agent
  whatIsAgent: {
    theme: 'amber',
    badge: 'Agent',
    title: '什么是 Agent？',
    render: () => `
      <p class="big-text">Agent（智能体）= LLM + <em>推理能力</em> + <strong>工具调用</strong><br>让 AI 自主决策该做什么</p>
      <div class="two-col">
        <div class="col">
          <div class="icon-big">🔗</div>
          <h3>Chain 链</h3>
          <p class="small">预定义的固定流程<br>A → B → C</p>
        </div>
        <div class="col">
          <div class="icon-big">🤖</div>
          <h3>Agent 智能体</h3>
          <p class="small">LLM 自主决定下一步<br>动态选择工具</p>
        </div>
      </div>
      <div class="flow-chart">
        <div class="flow-step">用户提问</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">LLM 思考<br><span class="small">该用什么工具？</span></div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">调用工具</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">观察结果</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">继续/回答</div>
      </div>
      <div class="example-box">
        <div class="example-title">💡 Agent 的 ReAct 循环</div>
        <ul>
          <li><b>Thought</b> — 我需要搜索最新天气</li>
          <li><b>Action</b> — 调用天气查询工具</li>
          <li><b>Observation</b> — 北京今天 25°C 晴</li>
          <li><b>Answer</b> — 北京今天天气晴朗，25度</li>
        </ul>
      </div>
    `,
    init: () => {}
  },

  // 内置工具
  builtinTools: {
    theme: 'blue',
    badge: 'Agent',
    title: '内置工具集',
    render: () => `
      <p class="big-text">LangChain 提供丰富的<em>预置工具</em>，开箱即用</p>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feat-icon">🔍</div>
          <h4>搜索</h4>
          <p>Tavily / DuckDuckGo</p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">🧮</div>
          <h4>计算</h4>
          <p>Python REPL / Math</p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">🌐</div>
          <h4>网页</h4>
          <p>Web Scraping</p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">📁</div>
          <h4>文件</h4>
          <p>File Read/Write</p>
        </div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_community.tools.tavily_search <span class="kw">import</span> (
    TavilySearchResults
)
<span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI

<span class="cmt"># 搜索工具</span>
search = <span class="cls">TavilySearchResults</span>(max_results=<span class="num">3</span>)

<span class="cmt"># 测试工具</span>
results = search.invoke(<span class="str">"LangChain 最新版本"</span>)
print(results)</code></div>
      <div class="code-block"><span class="code-label">Terminal</span><code><span class="cmt"># 安装搜索工具依赖</span>
pip install tavily-python

<span class="cmt"># 设置 API Key</span>
<span class="cmt"># export TAVILY_API_KEY=tvly-xxx...</span></code></div>
    `,
    init: () => {}
  },

  // 自定义工具
  customTools: {
    theme: 'green',
    badge: 'Agent',
    title: '自定义工具',
    render: () => `
      <p class="big-text">用 <em>@tool</em> 装饰器将任何 Python 函数变成 Agent 可调用的工具</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_core.tools <span class="kw">import</span> tool

<span class="dec">@tool</span>
<span class="kw">def</span> <span class="fn">get_weather</span>(city: <span class="built">str</span>) -> <span class="built">str</span>:
    <span class="str">"""查询指定城市的天气信息。

    Args:
        city: 城市名称，如"北京"
    """</span>
    <span class="cmt"># 实际项目中调用天气 API</span>
    weather_data = {
        <span class="str">"北京"</span>: <span class="str">"晴天 25°C"</span>,
        <span class="str">"上海"</span>: <span class="str">"多云 22°C"</span>,
    }
    <span class="kw">return</span> weather_data.get(
        city, <span class="str">f"未找到{city}的天气"</span>
    )

<span class="dec">@tool</span>
<span class="kw">def</span> <span class="fn">calculate</span>(expression: <span class="built">str</span>) -> <span class="built">str</span>:
    <span class="str">"""计算数学表达式。

    Args:
        expression: 数学表达式，如"2+3*4"
    """</span>
    <span class="kw">try</span>:
        <span class="kw">return</span> <span class="built">str</span>(<span class="built">eval</span>(expression))
    <span class="kw">except</span>:
        <span class="kw">return</span> <span class="str">"计算错误"</span>

<span class="cmt"># 查看工具信息</span>
print(get_weather.name)         <span class="cmt"># get_weather</span>
print(get_weather.description)  <span class="cmt"># 查询指定城市...</span>
print(get_weather.args_schema.model_json_schema())</code></div>
      <div class="warn-box">
        ⚠️ 工具的 <b>docstring 非常重要</b>！Agent 根据描述来决定何时使用哪个工具
      </div>
    `,
    init: () => {}
  },

  // ReAct Agent
  reactAgent: {
    theme: 'purple',
    badge: 'Agent',
    title: 'ReAct Agent 实战',
    render: () => `
      <p class="big-text">使用 <em>create_react_agent</em> 创建能<strong>推理 + 行动</strong>的智能体</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI
<span class="kw">from</span> langchain_core.tools <span class="kw">import</span> tool
<span class="kw">from</span> langgraph.prebuilt <span class="kw">import</span> create_react_agent

<span class="dec">@tool</span>
<span class="kw">def</span> <span class="fn">search_web</span>(query: <span class="built">str</span>) -> <span class="built">str</span>:
    <span class="str">"""搜索互联网信息"""</span>
    <span class="kw">return</span> <span class="str">f"搜索'{query}'的结果: ..."</span>

<span class="dec">@tool</span>
<span class="kw">def</span> <span class="fn">calculator</span>(expr: <span class="built">str</span>) -> <span class="built">str</span>:
    <span class="str">"""计算数学表达式"""</span>
    <span class="kw">return</span> <span class="built">str</span>(<span class="built">eval</span>(expr))

<span class="cmt"># 创建 Agent</span>
llm = <span class="cls">ChatOpenAI</span>(model=<span class="str">"gpt-4o-mini"</span>)
tools = [search_web, calculator]

agent = create_react_agent(llm, tools)

<span class="cmt"># 运行 Agent</span>
result = agent.invoke({
    <span class="str">"messages"</span>: [
        (<span class="str">"user"</span>, <span class="str">"帮我算一下 25 * 48 + 130"</span>)
    ]
})

<span class="cmt"># Agent 会自动决定调用 calculator 工具</span>
print(result[<span class="str">"messages"</span>][-<span class="num">1</span>].content)</code></div>
      <div class="tip-box">
        💡 <b>langgraph</b> 是 LangChain 团队推荐的 Agent 构建框架，替代旧版 AgentExecutor
      </div>
    `,
    init: () => {}
  },

  // Structured Chat
  structuredChat: {
    theme: 'teal',
    badge: 'Agent',
    title: 'Tool Calling 工具调用',
    render: () => `
      <p class="big-text">利用模型原生的 <em>Tool Calling</em> 能力，更稳定地调用工具</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI
<span class="kw">from</span> langchain_core.tools <span class="kw">import</span> tool
<span class="kw">from</span> langchain_core.messages <span class="kw">import</span> HumanMessage

<span class="dec">@tool</span>
<span class="kw">def</span> <span class="fn">get_stock_price</span>(symbol: <span class="built">str</span>) -> <span class="built">str</span>:
    <span class="str">"""获取股票当前价格。

    Args:
        symbol: 股票代码，如 AAPL
    """</span>
    prices = {<span class="str">"AAPL"</span>: <span class="num">189.5</span>, <span class="str">"GOOG"</span>: <span class="num">141.8</span>}
    price = prices.get(symbol, <span class="str">"未找到"</span>)
    <span class="kw">return</span> <span class="str">f"{symbol} 当前价格: ${price}"</span>

<span class="cmt"># 绑定工具到模型</span>
llm = <span class="cls">ChatOpenAI</span>(model=<span class="str">"gpt-4o-mini"</span>)
llm_with_tools = llm.bind_tools([get_stock_price])

<span class="cmt"># 模型会返回 tool_calls</span>
response = llm_with_tools.invoke(
    <span class="str">"苹果公司股价多少？"</span>
)

<span class="cmt"># 解析工具调用</span>
<span class="kw">for</span> tc <span class="kw">in</span> response.tool_calls:
    print(<span class="str">f"工具: {tc['name']}"</span>)
    print(<span class="str">f"参数: {tc['args']}"</span>)
<span class="cmt"># 工具: get_stock_price</span>
<span class="cmt"># 参数: {'symbol': 'AAPL'}</span></code></div>
      <div class="example-box">
        <div class="example-title">🔧 Tool Calling vs ReAct</div>
        <ul>
          <li><b>Tool Calling</b> — 模型原生支持，更精确</li>
          <li><b>ReAct</b> — 通用性强，可观察推理过程</li>
          <li>推荐使用 <b>Tool Calling</b>，主流模型都支持</li>
        </ul>
      </div>
    `,
    init: () => {}
  }
};

window.AgentCards = AgentCards;

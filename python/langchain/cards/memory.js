// ===== 卡片模块：记忆系统 =====

const MemoryCards = {
  // 为什么需要记忆
  whyMemory: {
    theme: 'pink',
    badge: '记忆',
    title: '为什么需要记忆？',
    render: () => `
      <p class="big-text">LLM 本身<em>无状态</em>，每次调用都是全新的。记忆系统让对话具备<strong>上下文感知</strong></p>
      <div class="two-col">
        <div class="col">
          <div class="icon-big">😐</div>
          <h3>无记忆</h3>
          <p class="small">用户: 我叫张三<br>AI: 你好张三！<br>用户: 我叫什么？<br>AI: <em>我不知道...</em></p>
        </div>
        <div class="col">
          <div class="icon-big">🧠</div>
          <h3>有记忆</h3>
          <p class="small">用户: 我叫张三<br>AI: 你好张三！<br>用户: 我叫什么？<br>AI: <b>你叫张三！</b></p>
        </div>
      </div>
      <div class="flow-chart">
        <div class="flow-step">用户输入</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">加载历史<br><span class="small">Memory</span></div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">LLM 处理</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">保存记忆</div>
      </div>
      <div class="tip-box">
        💡 记忆的本质：<b>将历史对话注入到当前 Prompt 中</b>，让模型感知上下文
      </div>
    `,
    init: () => {}
  },

  // Buffer Memory
  bufferMemory: {
    theme: 'blue',
    badge: '记忆',
    title: 'ChatMessageHistory',
    render: () => `
      <p class="big-text">最简单的记忆方式 — <em>保存完整对话历史</em>并注入提示词</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_core.chat_history <span class="kw">import</span> (
    InMemoryChatMessageHistory
)
<span class="kw">from</span> langchain_core.prompts <span class="kw">import</span> (
    ChatPromptTemplate, MessagesPlaceholder
)
<span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI

<span class="cmt"># 创建历史存储</span>
history = <span class="cls">InMemoryChatMessageHistory</span>()

<span class="cmt"># 含历史的提示模板</span>
prompt = <span class="cls">ChatPromptTemplate</span>.from_messages([
    (<span class="str">"system"</span>, <span class="str">"你是一个友好的助手"</span>),
    <span class="cls">MessagesPlaceholder</span>(<span class="str">"history"</span>),
    (<span class="str">"human"</span>, <span class="str">"{input}"</span>),
])

chain = prompt | <span class="cls">ChatOpenAI</span>(model=<span class="str">"gpt-4o-mini"</span>)

<span class="cmt"># 多轮对话</span>
<span class="kw">def</span> <span class="fn">chat</span>(user_input):
    response = chain.invoke({
        <span class="str">"input"</span>: user_input,
        <span class="str">"history"</span>: history.messages,
    })
    history.add_user_message(user_input)
    history.add_ai_message(response.content)
    <span class="kw">return</span> response.content

print(chat(<span class="str">"我叫小明"</span>))
print(chat(<span class="str">"我叫什么名字？"</span>))
<span class="cmt"># → 你叫小明！</span></code></div>
      <div class="warn-box">
        ⚠️ 完整保存历史会消耗大量 Token，长对话建议使用<b>摘要记忆</b>或<b>窗口记忆</b>
      </div>
    `,
    init: () => {}
  },

  // Summary Memory
  summaryMemory: {
    theme: 'green',
    badge: '记忆',
    title: '记忆策略对比',
    render: () => `
      <p class="big-text">根据场景选择合适的<em>记忆策略</em></p>
      <table class="compare-table">
        <tr><th>策略</th><th>原理</th><th>适用场景</th></tr>
        <tr><td><b>完整历史</b></td><td>保存所有消息</td><td>短对话</td></tr>
        <tr><td><b>窗口记忆</b></td><td>只保留最近 N 轮</td><td>一般对话</td></tr>
        <tr><td><b>Token 限制</b></td><td>按 Token 数裁剪</td><td>精确控制成本</td></tr>
        <tr><td><b>摘要记忆</b></td><td>LLM 总结历史</td><td>长对话</td></tr>
      </table>
      <div class="code-block"><span class="code-label">Python</span><code><span class="cmt"># 窗口记忆：只保留最近 k 轮对话</span>
<span class="kw">from</span> langchain_core.messages <span class="kw">import</span> (
    HumanMessage, AIMessage, trim_messages
)

messages = [
    <span class="cls">HumanMessage</span>(<span class="str">"你好"</span>),
    <span class="cls">AIMessage</span>(<span class="str">"你好！"</span>),
    <span class="cls">HumanMessage</span>(<span class="str">"1+1等于多少"</span>),
    <span class="cls">AIMessage</span>(<span class="str">"等于2"</span>),
    <span class="cls">HumanMessage</span>(<span class="str">"那乘以3呢"</span>),
    <span class="cls">AIMessage</span>(<span class="str">"等于6"</span>),
]

<span class="cmt"># 只保留最近 2 轮 (4条消息)</span>
trimmed = trim_messages(
    messages,
    max_tokens=<span class="num">100</span>,
    strategy=<span class="str">"last"</span>,
    token_counter=<span class="built">len</span>,
    allow_partial=<span class="kw">False</span>,
)
<span class="cmt"># 保留最后几条消息</span></code></div>
      <div class="tip-box">
        💡 实际项目中推荐 <b>窗口 + 摘要</b> 混合策略：近期对话完整保留，远期对话用摘要压缩
      </div>
    `,
    init: () => {}
  },

  // 持久化记忆
  persistMemory: {
    theme: 'purple',
    badge: '记忆',
    title: '持久化记忆存储',
    render: () => `
      <p class="big-text">将对话记忆<em>持久化</em>到数据库，实现<strong>跨会话记忆</strong></p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_core.chat_history <span class="kw">import</span> (
    BaseChatMessageHistory
)
<span class="kw">from</span> langchain_core.runnables.history <span class="kw">import</span> (
    RunnableWithMessageHistory
)
<span class="kw">from</span> langchain_core.prompts <span class="kw">import</span> (
    ChatPromptTemplate, MessagesPlaceholder
)
<span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI
<span class="kw">from</span> langchain_core.chat_history <span class="kw">import</span> (
    InMemoryChatMessageHistory
)

<span class="cmt"># 会话存储（生产中可换成 Redis/SQL）</span>
store = {}

<span class="kw">def</span> <span class="fn">get_session_history</span>(session_id: <span class="built">str</span>):
    <span class="kw">if</span> session_id <span class="kw">not in</span> store:
        store[session_id] = <span class="cls">InMemoryChatMessageHistory</span>()
    <span class="kw">return</span> store[session_id]

prompt = <span class="cls">ChatPromptTemplate</span>.from_messages([
    (<span class="str">"system"</span>, <span class="str">"你是助手"</span>),
    <span class="cls">MessagesPlaceholder</span>(<span class="str">"history"</span>),
    (<span class="str">"human"</span>, <span class="str">"{input}"</span>),
])

chain = prompt | <span class="cls">ChatOpenAI</span>(model=<span class="str">"gpt-4o-mini"</span>)

<span class="cmt"># 自动管理会话历史</span>
with_history = <span class="cls">RunnableWithMessageHistory</span>(
    chain,
    get_session_history,
    input_messages_key=<span class="str">"input"</span>,
    history_messages_key=<span class="str">"history"</span>,
)

<span class="cmt"># 不同用户有独立会话</span>
config = {<span class="str">"configurable"</span>: {<span class="str">"session_id"</span>: <span class="str">"user_001"</span>}}
result = with_history.invoke(
    {<span class="str">"input"</span>: <span class="str">"你好"</span>}, config=config
)</code></div>
      <div class="example-box">
        <div class="example-title">💾 生产级存储方案</div>
        <ul>
          <li><b>Redis</b> — 高性能，适合实时聊天</li>
          <li><b>PostgreSQL</b> — 结构化查询</li>
          <li><b>MongoDB</b> — 灵活文档存储</li>
        </ul>
      </div>
    `,
    init: () => {}
  }
};

window.MemoryCards = MemoryCards;

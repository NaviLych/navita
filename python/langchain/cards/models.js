// ===== 卡片模块：模型与提示 =====

const ModelsCards = {
  // LLM 基础
  llmBasics: {
    theme: 'orange',
    badge: '模型',
    title: 'LLM 与 ChatModel',
    render: () => `
      <p class="big-text">LangChain 中两种核心模型接口：<em>LLM</em>（文本补全）和 <strong>ChatModel</strong>（对话式）</p>
      <div class="two-col">
        <div class="col">
          <div class="icon-big">📝</div>
          <h3>LLM</h3>
          <p class="small">输入字符串 → 输出字符串<br>适合文本生成、补全</p>
        </div>
        <div class="col">
          <div class="icon-big">💬</div>
          <h3>ChatModel</h3>
          <p class="small">输入消息列表 → 输出消息<br>适合对话、问答</p>
        </div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI

<span class="cmt"># ChatModel（推荐，最常用）</span>
chat = <span class="cls">ChatOpenAI</span>(
    model=<span class="str">"gpt-4o-mini"</span>,
    temperature=<span class="num">0.7</span>,   <span class="cmt"># 创造性 0~2</span>
    max_tokens=<span class="num">500</span>,     <span class="cmt"># 最大输出长度</span>
)

<span class="cmt"># 简单调用</span>
response = chat.invoke(<span class="str">"用一句话解释量子计算"</span>)
print(response.content)</code></div>
      <div class="tip-box">
        💡 现代 LLM 开发中 <b>ChatModel</b> 是主流，LangChain 推荐优先使用 ChatModel
      </div>
    `,
    init: () => {}
  },

  // ChatModel 消息类型
  chatModels: {
    theme: 'blue',
    badge: '模型',
    title: '消息类型详解',
    render: () => `
      <p class="big-text">ChatModel 使用<em>消息对象</em>进行交互，每种消息有不同角色</p>
      <table class="compare-table">
        <tr><th>消息类型</th><th>角色</th><th>用途</th></tr>
        <tr><td><b>SystemMessage</b></td><td>系统</td><td>设定 AI 角色和行为</td></tr>
        <tr><td><b>HumanMessage</b></td><td>用户</td><td>用户输入内容</td></tr>
        <tr><td><b>AIMessage</b></td><td>AI</td><td>模型输出内容</td></tr>
        <tr><td><b>ToolMessage</b></td><td>工具</td><td>工具调用结果</td></tr>
      </table>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_core.messages <span class="kw">import</span> (
    SystemMessage, HumanMessage
)
<span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI

chat = <span class="cls">ChatOpenAI</span>(model=<span class="str">"gpt-4o-mini"</span>)

messages = [
    <span class="cls">SystemMessage</span>(<span class="str">"你是一位Python专家，回答简洁"</span>),
    <span class="cls">HumanMessage</span>(<span class="str">"list 和 tuple 有什么区别？"</span>),
]

response = chat.invoke(messages)
print(response.content)</code></div>
      <div class="output-block">list 是可变序列，tuple 是不可变序列。list 用 [] 创建，tuple 用 () 创建。需要修改数据用 list，数据固定用 tuple。</div>
    `,
    init: () => {}
  },

  // Prompt Templates
  promptTemplates: {
    theme: 'green',
    badge: '提示词',
    title: 'Prompt Templates',
    render: () => `
      <p class="big-text">用<em>模板</em>替代硬编码提示词，实现<strong>可复用、可参数化</strong>的提示工程</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_core.prompts <span class="kw">import</span> (
    ChatPromptTemplate
)

<span class="cmt"># 创建模板</span>
prompt = <span class="cls">ChatPromptTemplate</span>.from_messages([
    (<span class="str">"system"</span>, <span class="str">"你是{role}，用{style}风格回答"</span>),
    (<span class="str">"human"</span>, <span class="str">"{question}"</span>),
])

<span class="cmt"># 填充参数</span>
messages = prompt.invoke({
    <span class="str">"role"</span>: <span class="str">"美食评论家"</span>,
    <span class="str">"style"</span>: <span class="str">"幽默"</span>,
    <span class="str">"question"</span>: <span class="str">"评价一下麻辣火锅"</span>,
})

<span class="cmt"># 组合模型调用</span>
<span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI
chat = <span class="cls">ChatOpenAI</span>(model=<span class="str">"gpt-4o-mini"</span>)
response = chat.invoke(messages)
print(response.content)</code></div>
      <div class="example-box">
        <div class="example-title">🎯 为什么用模板？</div>
        <ul>
          <li>避免 f-string 字符串拼接的混乱</li>
          <li>模板可以保存、版本管理、复用</li>
          <li>与 LCEL 链式调用无缝集成</li>
        </ul>
      </div>
    `,
    init: () => {}
  },

  // Few-Shot Prompt
  fewShotPrompt: {
    theme: 'purple',
    badge: '提示词',
    title: 'Few-Shot 示例提示',
    render: () => `
      <p class="big-text">通过给模型几个<em>示例</em>，引导它按照期望的格式和风格输出</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_core.prompts <span class="kw">import</span> (
    ChatPromptTemplate,
    FewShotChatMessagePromptTemplate,
)

<span class="cmt"># 定义示例</span>
examples = [
    {<span class="str">"input"</span>: <span class="str">"happy"</span>, <span class="str">"output"</span>: <span class="str">"sad"</span>},
    {<span class="str">"input"</span>: <span class="str">"tall"</span>, <span class="str">"output"</span>: <span class="str">"short"</span>},
    {<span class="str">"input"</span>: <span class="str">"fast"</span>, <span class="str">"output"</span>: <span class="str">"slow"</span>},
]

<span class="cmt"># 示例模板</span>
example_prompt = <span class="cls">ChatPromptTemplate</span>.from_messages([
    (<span class="str">"human"</span>, <span class="str">"{input}"</span>),
    (<span class="str">"ai"</span>, <span class="str">"{output}"</span>),
])

few_shot = <span class="cls">FewShotChatMessagePromptTemplate</span>(
    example_prompt=example_prompt,
    examples=examples,
)

<span class="cmt"># 组合完整模板</span>
prompt = <span class="cls">ChatPromptTemplate</span>.from_messages([
    (<span class="str">"system"</span>, <span class="str">"给出单词的反义词"</span>),
    few_shot,
    (<span class="str">"human"</span>, <span class="str">"{input}"</span>),
])

result = prompt.invoke({<span class="str">"input"</span>: <span class="str">"bright"</span>})
print(result)  <span class="cmt"># → AI 会输出 "dark" / "dim"</span></code></div>
      <div class="tip-box">
        💡 Few-Shot 特别适合需要<b>特定输出格式</b>的场景，比 Zero-Shot 效果更稳定
      </div>
    `,
    init: () => {}
  },

  // Output Parsers
  outputParsers: {
    theme: 'teal',
    badge: '提示词',
    title: 'Output Parsers',
    render: () => `
      <p class="big-text">将 LLM 的<em>自由文本输出</em>解析为<strong>结构化数据</strong></p>
      <div class="flow-chart">
        <div class="flow-step">LLM 原始输出<br><span class="small">自由文本</span></div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">Output Parser<br><span class="small">解析器</span></div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">结构化数据<br><span class="small">JSON/对象</span></div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_core.output_parsers <span class="kw">import</span> (
    JsonOutputParser
)
<span class="kw">from</span> langchain_core.prompts <span class="kw">import</span> ChatPromptTemplate
<span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI
<span class="kw">from</span> pydantic <span class="kw">import</span> BaseModel, Field

<span class="cmt"># 定义输出结构</span>
<span class="kw">class</span> <span class="cls">BookInfo</span>(BaseModel):
    title: <span class="built">str</span> = Field(description=<span class="str">"书名"</span>)
    author: <span class="built">str</span> = Field(description=<span class="str">"作者"</span>)
    year: <span class="built">int</span> = Field(description=<span class="str">"出版年份"</span>)

parser = <span class="cls">JsonOutputParser</span>(pydantic_object=BookInfo)

prompt = <span class="cls">ChatPromptTemplate</span>.from_messages([
    (<span class="str">"system"</span>, <span class="str">"提取书籍信息。\n{format_instructions}"</span>),
    (<span class="str">"human"</span>, <span class="str">"{query}"</span>),
])

chain = prompt | <span class="cls">ChatOpenAI</span>(model=<span class="str">"gpt-4o-mini"</span>) | parser
result = chain.invoke({
    <span class="str">"query"</span>: <span class="str">"三体是刘慈欣2008年出版的"</span>,
    <span class="str">"format_instructions"</span>: parser.get_format_instructions()
})</code></div>
      <div class="output-block">{"title": "三体", "author": "刘慈欣", "year": 2008}</div>
    `,
    init: () => {}
  }
};

window.ModelsCards = ModelsCards;

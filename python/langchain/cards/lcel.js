// ===== 卡片模块：LCEL 链 =====

const LCELCards = {
  // 什么是 LCEL
  whatIsLCEL: {
    theme: 'indigo',
    badge: 'LCEL',
    title: '什么是 LCEL？',
    render: () => `
      <p class="big-text"><em>LangChain Expression Language</em> — 用 <strong>| 管道符</strong>组合组件，构建复杂的 LLM 工作流</p>
      <div class="pipe-visual">
        <div class="pipe-node">Prompt</div>
        <div class="pipe-sep">|</div>
        <div class="pipe-node highlight">LLM</div>
        <div class="pipe-sep">|</div>
        <div class="pipe-node">Parser</div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_core.prompts <span class="kw">import</span> ChatPromptTemplate
<span class="kw">from</span> langchain_core.output_parsers <span class="kw">import</span> StrOutputParser
<span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI

<span class="cmt"># 用 | 连接组件，形成链</span>
chain = (
    <span class="cls">ChatPromptTemplate</span>.from_template(
        <span class="str">"用一句话解释{topic}"</span>
    )
    | <span class="cls">ChatOpenAI</span>(model=<span class="str">"gpt-4o-mini"</span>)
    | <span class="cls">StrOutputParser</span>()
)

<span class="cmt"># 调用链</span>
result = chain.invoke({<span class="str">"topic"</span>: <span class="str">"机器学习"</span>})
print(result)

<span class="cmt"># 流式输出</span>
<span class="kw">for</span> chunk <span class="kw">in</span> chain.stream({<span class="str">"topic"</span>: <span class="str">"机器学习"</span>}):
    print(chunk, end=<span class="str">""</span>)</code></div>
      <div class="example-box">
        <div class="example-title">⚡ LCEL 的优势</div>
        <ul>
          <li><b>流式输出</b> — 自动支持 stream()</li>
          <li><b>异步支持</b> — 自动支持 ainvoke()</li>
          <li><b>批量处理</b> — 自动支持 batch()</li>
          <li><b>可观测性</b> — 自动集成 LangSmith 追踪</li>
        </ul>
      </div>
    `,
    init: () => {}
  },

  // RunnableSequence
  runnableSequence: {
    theme: 'cyan',
    badge: 'LCEL',
    title: '链式组合 Runnable',
    render: () => `
      <p class="big-text">每个组件都是 <em>Runnable</em>，支持统一的调用接口</p>
      <table class="compare-table">
        <tr><th>方法</th><th>说明</th><th>使用场景</th></tr>
        <tr><td><b>invoke()</b></td><td>单次调用</td><td>普通请求</td></tr>
        <tr><td><b>stream()</b></td><td>流式输出</td><td>实时显示</td></tr>
        <tr><td><b>batch()</b></td><td>批量调用</td><td>批处理任务</td></tr>
        <tr><td><b>ainvoke()</b></td><td>异步调用</td><td>高并发</td></tr>
      </table>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_core.runnables <span class="kw">import</span> (
    RunnableLambda
)

<span class="cmt"># 自定义 Runnable</span>
<span class="kw">def</span> <span class="fn">add_emoji</span>(text: <span class="built">str</span>) -> <span class="built">str</span>:
    <span class="kw">return</span> <span class="str">f"✨ </span>{text}<span class="str"> ✨"</span>

<span class="kw">def</span> <span class="fn">to_upper</span>(text: <span class="built">str</span>) -> <span class="built">str</span>:
    <span class="kw">return</span> text.upper()

<span class="cmt"># 链式组合</span>
chain = (
    RunnableLambda(add_emoji)
    | RunnableLambda(to_upper)
)

print(chain.invoke(<span class="str">"hello"</span>))
<span class="cmt"># ✨ HELLO ✨</span>

<span class="cmt"># 批量处理</span>
results = chain.batch([<span class="str">"hi"</span>, <span class="str">"bye"</span>])
<span class="cmt"># ['✨ HI ✨', '✨ BYE ✨']</span></code></div>
      <div class="tip-box">
        💡 <b>RunnableLambda</b> 可以把任何函数变成 Runnable，参与链式组合
      </div>
    `,
    init: () => {}
  },

  // 并行与分支
  parallelBranch: {
    theme: 'green',
    badge: 'LCEL',
    title: '并行与分支',
    render: () => `
      <p class="big-text">用 <em>RunnableParallel</em> 同时执行多个任务，用<strong>字典</strong>语法自动并行</p>
      <div class="pipe-visual">
        <div class="pipe-node">输入</div>
        <div class="pipe-sep">→</div>
        <div class="pipe-node highlight">分支A<br>分支B</div>
        <div class="pipe-sep">→</div>
        <div class="pipe-node">合并结果</div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_core.prompts <span class="kw">import</span> ChatPromptTemplate
<span class="kw">from</span> langchain_core.output_parsers <span class="kw">import</span> StrOutputParser
<span class="kw">from</span> langchain_core.runnables <span class="kw">import</span> RunnableParallel
<span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI

llm = <span class="cls">ChatOpenAI</span>(model=<span class="str">"gpt-4o-mini"</span>)
parser = <span class="cls">StrOutputParser</span>()

<span class="cmt"># 同时生成中文和英文翻译</span>
chain = RunnableParallel(
    chinese=(
        <span class="cls">ChatPromptTemplate</span>.from_template(
            <span class="str">"翻译为中文: {text}"</span>
        ) | llm | parser
    ),
    english=(
        <span class="cls">ChatPromptTemplate</span>.from_template(
            <span class="str">"Translate to English: {text}"</span>
        ) | llm | parser
    ),
)

result = chain.invoke({<span class="str">"text"</span>: <span class="str">"こんにちは"</span>})
<span class="cmt"># {'chinese': '你好', 'english': 'Hello'}</span></code></div>
      <div class="tip-box">
        💡 RunnableParallel 会<b>并发执行</b>所有分支，大幅提升效率
      </div>
    `,
    init: () => {}
  },

  // 路由与回退
  routingFallback: {
    theme: 'orange',
    badge: 'LCEL',
    title: '路由与回退',
    render: () => `
      <p class="big-text">根据条件<em>动态路由</em>到不同链，并设置<strong>降级回退</strong>策略</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_core.runnables <span class="kw">import</span> (
    RunnableLambda, RunnableBranch
)

<span class="cmt"># 条件路由：根据问题类型分发</span>
branch = <span class="cls">RunnableBranch</span>(
    <span class="cmt"># (条件函数, 处理链)</span>
    (
        <span class="kw">lambda</span> x: <span class="str">"代码"</span> <span class="kw">in</span> x[<span class="str">"question"</span>],
        code_chain,   <span class="cmt"># 代码相关 → 代码链</span>
    ),
    (
        <span class="kw">lambda</span> x: <span class="str">"数学"</span> <span class="kw">in</span> x[<span class="str">"question"</span>],
        math_chain,   <span class="cmt"># 数学相关 → 数学链</span>
    ),
    default_chain,    <span class="cmt"># 默认 → 通用链</span>
)</code></div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="cmt"># 回退机制：主模型失败时切换备用</span>
<span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI

main_llm = <span class="cls">ChatOpenAI</span>(model=<span class="str">"gpt-4o"</span>)
fallback_llm = <span class="cls">ChatOpenAI</span>(model=<span class="str">"gpt-4o-mini"</span>)

<span class="cmt"># 主模型出错时自动切换到备用模型</span>
llm_with_fallback = main_llm.with_fallbacks(
    [fallback_llm]
)

<span class="cmt"># 正常使用，自动降级</span>
result = llm_with_fallback.invoke(<span class="str">"你好"</span>)</code></div>
      <div class="warn-box">
        ⚠️ 生产环境中建议始终配置 <b>with_fallbacks</b>，提高系统可用性
      </div>
    `,
    init: () => {}
  }
};

window.LCELCards = LCELCards;

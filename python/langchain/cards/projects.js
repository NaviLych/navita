// ===== 卡片模块：实战项目 =====

const ProjectCards = {
  // 项目1: PDF 问答
  pdfQA: {
    theme: 'red',
    badge: '实战',
    title: '项目：PDF 智能问答',
    render: () => `
      <p class="big-text">构建一个可以回答 <em>PDF 文档</em>内容问题的 AI 助手</p>
      <div class="flow-chart">
        <div class="flow-step">📄 PDF</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">✂️ 分块</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">💾 向量库</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">❓ 问答</div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_community.document_loaders <span class="kw">import</span> PyPDFLoader
<span class="kw">from</span> langchain_text_splitters <span class="kw">import</span> (
    RecursiveCharacterTextSplitter
)
<span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI, OpenAIEmbeddings
<span class="kw">from</span> langchain_community.vectorstores <span class="kw">import</span> FAISS
<span class="kw">from</span> langchain_core.prompts <span class="kw">import</span> ChatPromptTemplate
<span class="kw">from</span> langchain_core.output_parsers <span class="kw">import</span> StrOutputParser
<span class="kw">from</span> langchain_core.runnables <span class="kw">import</span> RunnablePassthrough

<span class="cmt"># 1. 加载 PDF</span>
loader = <span class="cls">PyPDFLoader</span>(<span class="str">"company_report.pdf"</span>)
pages = loader.load()

<span class="cmt"># 2. 分块</span>
splitter = <span class="cls">RecursiveCharacterTextSplitter</span>(
    chunk_size=<span class="num">800</span>, chunk_overlap=<span class="num">100</span>
)
chunks = splitter.split_documents(pages)

<span class="cmt"># 3. 存入向量数据库</span>
vectorstore = <span class="cls">FAISS</span>.from_documents(
    chunks, <span class="cls">OpenAIEmbeddings</span>()
)
retriever = vectorstore.as_retriever()

<span class="cmt"># 4. 构建问答链</span>
prompt = <span class="cls">ChatPromptTemplate</span>.from_template(<span class="str">"""
根据以下文档内容回答问题。只根据提供的内容回答。

文档内容：
{context}

问题：{question}
回答："""</span>)

<span class="kw">def</span> <span class="fn">format_docs</span>(docs):
    <span class="kw">return</span> <span class="str">"\n\n"</span>.join(d.page_content <span class="kw">for</span> d <span class="kw">in</span> docs)

qa_chain = (
    {<span class="str">"context"</span>: retriever | format_docs,
     <span class="str">"question"</span>: <span class="cls">RunnablePassthrough</span>()}
    | prompt
    | <span class="cls">ChatOpenAI</span>(model=<span class="str">"gpt-4o-mini"</span>)
    | <span class="cls">StrOutputParser</span>()
)

<span class="cmt"># 5. 提问</span>
answer = qa_chain.invoke(<span class="str">"公司去年营收多少？"</span>)
print(answer)</code></div>
    `,
    init: () => {}
  },

  // 项目2: Web 搜索助手
  webSearch: {
    theme: 'blue',
    badge: '实战',
    title: '项目：AI 搜索助手',
    render: () => `
      <p class="big-text">构建能<em>联网搜索</em>并<strong>总结回答</strong>的 AI 助手</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI
<span class="kw">from</span> langchain_core.tools <span class="kw">import</span> tool
<span class="kw">from</span> langchain_core.prompts <span class="kw">import</span> ChatPromptTemplate
<span class="kw">from</span> langgraph.prebuilt <span class="kw">import</span> create_react_agent
<span class="kw">from</span> langchain_community.tools.tavily_search <span class="kw">import</span> (
    TavilySearchResults
)

<span class="cmt"># 搜索工具</span>
search_tool = <span class="cls">TavilySearchResults</span>(
    max_results=<span class="num">5</span>,
    search_depth=<span class="str">"advanced"</span>,
)

<span class="cmt"># 系统提示</span>
system_prompt = <span class="str">"""你是一个智能搜索助手。
使用搜索工具获取最新信息，然后用中文给出
清晰、有条理的回答。注明信息来源。"""</span>

<span class="cmt"># 创建 Agent</span>
llm = <span class="cls">ChatOpenAI</span>(model=<span class="str">"gpt-4o-mini"</span>)
agent = create_react_agent(
    llm,
    [search_tool],
    prompt=system_prompt,
)

<span class="cmt"># 使用</span>
result = agent.invoke({
    <span class="str">"messages"</span>: [
        (<span class="str">"user"</span>, <span class="str">"2024年AI领域有哪些重大突破？"</span>)
    ]
})

<span class="cmt"># 打印 Agent 的完整回答</span>
print(result[<span class="str">"messages"</span>][-<span class="num">1</span>].content)</code></div>
      <div class="tip-box">
        💡 Agent 会自动执行搜索 → 阅读结果 → 总结回答的完整流程
      </div>
    `,
    init: () => {}
  },

  // 项目3: Multi-Agent
  multiAgent: {
    theme: 'purple',
    badge: '实战',
    title: '项目：多 Agent 协作',
    render: () => `
      <p class="big-text">使用 <em>LangGraph</em> 编排多个 Agent <strong>协同工作</strong></p>
      <div class="pipe-visual">
        <div class="pipe-node">📝 调研员</div>
        <div class="pipe-sep">→</div>
        <div class="pipe-node highlight">✍️ 写作者</div>
        <div class="pipe-sep">→</div>
        <div class="pipe-node">🔍 审核员</div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langgraph.graph <span class="kw">import</span> StateGraph, MessagesState
<span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI

llm = <span class="cls">ChatOpenAI</span>(model=<span class="str">"gpt-4o-mini"</span>)

<span class="cmt"># 定义各角色节点</span>
<span class="kw">def</span> <span class="fn">researcher</span>(state: MessagesState):
    <span class="str">"""调研员：收集信息"""</span>
    response = llm.invoke([
        (<span class="str">"system"</span>, <span class="str">"你是调研员，搜集话题要点"</span>),
        *state[<span class="str">"messages"</span>],
    ])
    <span class="kw">return</span> {<span class="str">"messages"</span>: [response]}

<span class="kw">def</span> <span class="fn">writer</span>(state: MessagesState):
    <span class="str">"""写作者：撰写文章"""</span>
    response = llm.invoke([
        (<span class="str">"system"</span>, <span class="str">"你是写作者，根据调研写文章"</span>),
        *state[<span class="str">"messages"</span>],
    ])
    <span class="kw">return</span> {<span class="str">"messages"</span>: [response]}

<span class="kw">def</span> <span class="fn">reviewer</span>(state: MessagesState):
    <span class="str">"""审核员：审核文章质量"""</span>
    response = llm.invoke([
        (<span class="str">"system"</span>, <span class="str">"你是审核员，给出修改建议"</span>),
        *state[<span class="str">"messages"</span>],
    ])
    <span class="kw">return</span> {<span class="str">"messages"</span>: [response]}

<span class="cmt"># 构建工作流图</span>
graph = <span class="cls">StateGraph</span>(MessagesState)
graph.add_node(<span class="str">"researcher"</span>, researcher)
graph.add_node(<span class="str">"writer"</span>, writer)
graph.add_node(<span class="str">"reviewer"</span>, reviewer)

graph.set_entry_point(<span class="str">"researcher"</span>)
graph.add_edge(<span class="str">"researcher"</span>, <span class="str">"writer"</span>)
graph.add_edge(<span class="str">"writer"</span>, <span class="str">"reviewer"</span>)

app = graph.compile()

<span class="cmt"># 运行</span>
result = app.invoke({
    <span class="str">"messages"</span>: [(<span class="str">"user"</span>, <span class="str">"写一篇关于AI的文章"</span>)]
})</code></div>
      <div class="example-box">
        <div class="example-title">🚀 继续学习</div>
        <ul>
          <li>📖 <b>LangChain 文档</b> — python.langchain.com</li>
          <li>🛠️ <b>LangSmith</b> — 追踪调试 LLM 应用</li>
          <li>🔄 <b>LangGraph</b> — 构建复杂 Agent 工作流</li>
          <li>🏗️ <b>LangServe</b> — 一键部署为 API 服务</li>
        </ul>
      </div>
    `,
    init: () => {}
  }
};

window.ProjectCards = ProjectCards;

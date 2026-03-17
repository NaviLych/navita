// ===== 卡片模块：RAG 检索增强 =====

const RAGCards = {
  // 什么是 RAG
  whatIsRAG: {
    theme: 'red',
    badge: 'RAG',
    title: '什么是 RAG？',
    render: () => `
      <p class="big-text"><em>Retrieval-Augmented Generation</em><br>检索增强生成 — 让 LLM 基于<strong>你的私有数据</strong>回答问题</p>
      <div class="flow-chart">
        <div class="flow-step">📄 文档</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">✂️ 分块</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">🔢 向量化</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">💾 存储</div>
      </div>
      <div class="flow-chart">
        <div class="flow-step">❓ 提问</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">🔍 检索</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">📝 拼接</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">🤖 生成</div>
      </div>
      <div class="example-box">
        <div class="example-title">🎯 RAG 典型场景</div>
        <ul>
          <li>📚 企业知识库问答</li>
          <li>📋 合同/法律文档分析</li>
          <li>🏥 医疗指南查询</li>
          <li>💻 代码文档搜索</li>
        </ul>
      </div>
      <div class="tip-box">
        💡 RAG 的核心优势：<b>无需微调模型</b>，即可让 LLM 利用最新的私有数据
      </div>
    `,
    init: () => {}
  },

  // Document Loaders
  documentLoaders: {
    theme: 'blue',
    badge: 'RAG',
    title: 'Document Loaders',
    render: () => `
      <p class="big-text">从各种数据源<em>加载文档</em>，LangChain 支持 <strong>100+</strong> 种数据源</p>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feat-icon">📄</div>
          <h4>PDF</h4>
          <p>PyPDFLoader</p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">🌐</div>
          <h4>网页</h4>
          <p>WebBaseLoader</p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">📊</div>
          <h4>CSV</h4>
          <p>CSVLoader</p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">📁</div>
          <h4>目录</h4>
          <p>DirectoryLoader</p>
        </div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="cmt"># 加载 PDF 文档</span>
<span class="kw">from</span> langchain_community.document_loaders <span class="kw">import</span> (
    PyPDFLoader
)

loader = <span class="cls">PyPDFLoader</span>(<span class="str">"report.pdf"</span>)
docs = loader.load()

print(<span class="built">len</span>(docs))         <span class="cmt"># 页数</span>
print(docs[<span class="num">0</span>].page_content)  <span class="cmt"># 第一页内容</span>
print(docs[<span class="num">0</span>].metadata)      <span class="cmt"># {'source': 'report.pdf', 'page': 0}</span></code></div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="cmt"># 加载网页</span>
<span class="kw">from</span> langchain_community.document_loaders <span class="kw">import</span> (
    WebBaseLoader
)

loader = <span class="cls">WebBaseLoader</span>(
    <span class="str">"https://docs.python.org/3/tutorial/"</span>
)
docs = loader.load()
print(docs[<span class="num">0</span>].page_content[:<span class="num">200</span>])</code></div>
    `,
    init: () => {}
  },

  // Text Splitting
  textSplitting: {
    theme: 'green',
    badge: 'RAG',
    title: 'Text Splitting 分块',
    render: () => `
      <p class="big-text">将长文档切分为<em>语义完整的小块</em>，以便精确检索</p>
      <div class="two-col">
        <div class="col">
          <div class="icon-big">📄</div>
          <h3>长文档</h3>
          <p class="small">可能有几千到几万字</p>
        </div>
        <div class="col">
          <div class="icon-big">🧩</div>
          <h3>分块后</h3>
          <p class="small">每块 500~1000 字符</p>
        </div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_text_splitters <span class="kw">import</span> (
    RecursiveCharacterTextSplitter
)

<span class="cmt"># 最常用的分块器</span>
splitter = <span class="cls">RecursiveCharacterTextSplitter</span>(
    chunk_size=<span class="num">500</span>,        <span class="cmt"># 每块最大字符数</span>
    chunk_overlap=<span class="num">50</span>,      <span class="cmt"># 块间重叠字符数</span>
    separators=[<span class="str">"\n\n"</span>, <span class="str">"\n"</span>, <span class="str">"。"</span>, <span class="str">"，"</span>, <span class="str">" "</span>],
)

text = <span class="str">"""LangChain 是一个强大的框架...
（长文本内容）..."""</span>

chunks = splitter.split_text(text)
print(<span class="str">f"原文长度: </span>{<span class="built">len</span>(text)}<span class="str">"</span>)
print(<span class="str">f"分成 </span>{<span class="built">len</span>(chunks)}<span class="str"> 块"</span>)
print(<span class="str">f"第一块: </span>{chunks[<span class="num">0</span>][:<span class="num">100</span>]}<span class="str">..."</span>)</code></div>
      <div class="example-box">
        <div class="example-title">✂️ 分块策略选择</div>
        <ul>
          <li><b>RecursiveCharacter</b> — 通用首选，按层次分割</li>
          <li><b>MarkdownHeader</b> — Markdown 文档按标题拆分</li>
          <li><b>TokenTextSplitter</b> — 按 Token 数精确控制</li>
          <li><b>SemanticChunker</b> — 按语义相似度分块</li>
        </ul>
      </div>
    `,
    init: () => {}
  },

  // Embeddings
  embeddings: {
    theme: 'purple',
    badge: 'RAG',
    title: 'Embeddings 向量嵌入',
    render: () => `
      <p class="big-text">将文本转换为<em>高维向量</em>，语义相似的文本在向量空间中<strong>距离更近</strong></p>
      <div class="pipe-visual">
        <div class="pipe-node">"猫喜欢鱼"</div>
        <div class="pipe-sep">→</div>
        <div class="pipe-node highlight">Embedding<br>Model</div>
        <div class="pipe-sep">→</div>
        <div class="pipe-node">[0.2, -0.5, ...]</div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_openai <span class="kw">import</span> OpenAIEmbeddings

<span class="cmt"># 创建嵌入模型</span>
embeddings = <span class="cls">OpenAIEmbeddings</span>(
    model=<span class="str">"text-embedding-3-small"</span>
)

<span class="cmt"># 单文本嵌入</span>
vector = embeddings.embed_query(<span class="str">"LangChain 是什么？"</span>)
print(<span class="str">f"向量维度: </span>{<span class="built">len</span>(vector)}<span class="str">"</span>)
<span class="cmt"># 向量维度: 1536</span>

<span class="cmt"># 批量嵌入</span>
texts = [<span class="str">"猫喜欢鱼"</span>, <span class="str">"狗喜欢骨头"</span>, <span class="str">"Python编程"</span>]
vectors = embeddings.embed_documents(texts)
print(<span class="str">f"生成了 </span>{<span class="built">len</span>(vectors)}<span class="str"> 个向量"</span>)</code></div>
      <div class="example-box">
        <div class="example-title">🔢 常用 Embedding 模型</div>
        <ul>
          <li><b>OpenAI</b> — text-embedding-3-small/large</li>
          <li><b>HuggingFace</b> — 开源免费，本地运行</li>
          <li><b>Cohere</b> — 多语言支持好</li>
        </ul>
      </div>
    `,
    init: () => {}
  },

  // Vector Stores
  vectorStores: {
    theme: 'indigo',
    badge: 'RAG',
    title: 'Vector Store 向量数据库',
    render: () => `
      <p class="big-text">存储向量并支持<em>相似度搜索</em>，RAG 的核心存储组件</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_openai <span class="kw">import</span> OpenAIEmbeddings
<span class="kw">from</span> langchain_community.vectorstores <span class="kw">import</span> FAISS

<span class="cmt"># 准备文档</span>
texts = [
    <span class="str">"LangChain 是 LLM 应用开发框架"</span>,
    <span class="str">"RAG 可以检索私有数据增强 LLM"</span>,
    <span class="str">"FAISS 是 Meta 开源的向量数据库"</span>,
    <span class="str">"Python 是最流行的编程语言之一"</span>,
]

<span class="cmt"># 创建向量存储</span>
embeddings = <span class="cls">OpenAIEmbeddings</span>()
vectorstore = <span class="cls">FAISS</span>.from_texts(texts, embeddings)

<span class="cmt"># 相似度搜索</span>
results = vectorstore.similarity_search(
    <span class="str">"什么是 RAG？"</span>, k=<span class="num">2</span>
)
<span class="kw">for</span> doc <span class="kw">in</span> results:
    print(doc.page_content)</code></div>
      <div class="output-block">RAG 可以检索私有数据增强 LLM
LangChain 是 LLM 应用开发框架</div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="cmt"># 持久化到本地磁盘</span>
vectorstore.save_local(<span class="str">"faiss_index"</span>)

<span class="cmt"># 加载已有索引</span>
loaded = <span class="cls">FAISS</span>.load_local(
    <span class="str">"faiss_index"</span>, embeddings,
    allow_dangerous_deserialization=<span class="kw">True</span>
)</code></div>
      <div class="example-box">
        <div class="example-title">💾 向量数据库选型</div>
        <ul>
          <li><b>FAISS</b> — 本地轻量，适合原型 <span class="tag green">推荐入门</span></li>
          <li><b>Chroma</b> — 嵌入式数据库，开发友好</li>
          <li><b>Pinecone</b> — 云托管，开箱即用</li>
          <li><b>Milvus</b> — 分布式，适合大规模数据</li>
        </ul>
      </div>
    `,
    init: () => {}
  },

  // 完整 RAG 链
  ragChain: {
    theme: 'teal',
    badge: 'RAG',
    title: '完整 RAG 链实战',
    render: () => `
      <p class="big-text">将所有组件串联，构建完整的<em>知识库问答系统</em></p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> langchain_openai <span class="kw">import</span> ChatOpenAI, OpenAIEmbeddings
<span class="kw">from</span> langchain_community.vectorstores <span class="kw">import</span> FAISS
<span class="kw">from</span> langchain_core.prompts <span class="kw">import</span> ChatPromptTemplate
<span class="kw">from</span> langchain_core.output_parsers <span class="kw">import</span> StrOutputParser
<span class="kw">from</span> langchain_core.runnables <span class="kw">import</span> (
    RunnablePassthrough
)

<span class="cmt"># 1. 准备数据（实际项目用 DocumentLoader）</span>
texts = [
    <span class="str">"公司成立于2020年，总部位于北京"</span>,
    <span class="str">"主要产品包括AI助手和数据分析平台"</span>,
    <span class="str">"团队规模50人，年营收5000万"</span>,
]

<span class="cmt"># 2. 创建向量数据库</span>
vectorstore = <span class="cls">FAISS</span>.from_texts(
    texts, <span class="cls">OpenAIEmbeddings</span>()
)
retriever = vectorstore.as_retriever(
    search_kwargs={<span class="str">"k"</span>: <span class="num">2</span>}
)

<span class="cmt"># 3. RAG 提示模板</span>
prompt = <span class="cls">ChatPromptTemplate</span>.from_template(<span class="str">"""
根据以下上下文回答问题。如果无法回答请说不知道。

上下文：{context}

问题：{question}
"""</span>)

<span class="cmt"># 4. 构建 RAG 链</span>
<span class="kw">def</span> <span class="fn">format_docs</span>(docs):
    <span class="kw">return</span> <span class="str">"\n"</span>.join(d.page_content <span class="kw">for</span> d <span class="kw">in</span> docs)

rag_chain = (
    {
        <span class="str">"context"</span>: retriever | format_docs,
        <span class="str">"question"</span>: <span class="cls">RunnablePassthrough</span>(),
    }
    | prompt
    | <span class="cls">ChatOpenAI</span>(model=<span class="str">"gpt-4o-mini"</span>)
    | <span class="cls">StrOutputParser</span>()
)

<span class="cmt"># 5. 提问！</span>
answer = rag_chain.invoke(<span class="str">"公司什么时候成立的？"</span>)
print(answer)</code></div>
      <div class="output-block">公司成立于2020年，总部位于北京。</div>
    `,
    init: () => {}
  }
};

window.RAGCards = RAGCards;

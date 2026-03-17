// ===== 卡片模块：RNN 序列模型 =====

const RNNCards = {
  // RNN 原理
  rnnPrinciple: {
    theme: 'pink',
    badge: 'RNN',
    title: 'RNN / LSTM 原理',
    render: () => `
      <p class="big-text">循环神经网络处理<em>序列数据</em>（文本、时间序列）</p>
      <div class="flow-chart">
        <div class="flow-step">x₁</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">h₁</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">h₂</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">h₃</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">输出</div>
      </div>
      <div class="two-col">
        <div class="col">
          <div class="icon-big">🔄</div>
          <h3>RNN</h3>
          <p class="small">简单循环，易梯度消失</p>
        </div>
        <div class="col">
          <div class="icon-big">🧠</div>
          <h3>LSTM</h3>
          <p class="small">门控机制，记忆长序列</p>
        </div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="cmt"># LSTM 基本用法</span>
lstm = nn.LSTM(
    input_size=<span class="num">100</span>,    <span class="cmt"># 输入特征维度</span>
    hidden_size=<span class="num">64</span>,   <span class="cmt"># 隐藏状态维度</span>
    num_layers=<span class="num">2</span>,     <span class="cmt"># 堆叠层数</span>
    batch_first=<span class="kw">True</span>, <span class="cmt"># 输入 (batch, seq, feat)</span>
    bidirectional=<span class="kw">True</span> <span class="cmt"># 双向</span>
)

<span class="cmt"># 输入: (batch, seq_len, input_size)</span>
x = torch.randn(<span class="num">32</span>, <span class="num">50</span>, <span class="num">100</span>)
output, (h_n, c_n) = lstm(x)
<span class="cmt"># output: (32, 50, 128) → 双向所以 64*2</span>
<span class="cmt"># h_n: (4, 32, 64)    → 2层*2方向</span></code></div>
      <div class="tip-box">
        💡 实际项目推荐 <b>LSTM/GRU</b> 替代原始 RNN，或用 <b>Transformer</b>
      </div>
    `,
    init: () => {}
  },

  // 文本分类
  textClassify: {
    theme: 'orange',
    badge: 'RNN',
    title: '实战：文本情感分类',
    render: () => `
      <p class="big-text">用 LSTM 判断评论是<em>正面</em>还是<em>负面</em></p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">class</span> <span class="cls">SentimentLSTM</span>(nn.Module):
    <span class="kw">def</span> <span class="fn">__init__</span>(self, vocab_size, embed_dim,
                 hidden_dim, num_classes):
        <span class="built">super</span>().__init__()
        self.embedding = nn.Embedding(
            vocab_size, embed_dim
        )
        self.lstm = nn.LSTM(
            embed_dim, hidden_dim,
            num_layers=<span class="num">2</span>,
            batch_first=<span class="kw">True</span>,
            dropout=<span class="num">0.3</span>
        )
        self.fc = nn.Linear(hidden_dim, num_classes)

    <span class="kw">def</span> <span class="fn">forward</span>(self, x):
        <span class="cmt"># x: (batch, seq_len) 词索引</span>
        emb = self.embedding(x)  <span class="cmt"># → 词向量</span>
        out, (h_n, _) = self.lstm(emb)
        <span class="cmt"># 取最后一层的隐藏状态</span>
        last_h = h_n[-<span class="num">1</span>]  <span class="cmt"># (batch, hidden)</span>
        <span class="kw">return</span> self.fc(last_h)

model = <span class="cls">SentimentLSTM</span>(
    vocab_size=<span class="num">10000</span>,
    embed_dim=<span class="num">128</span>,
    hidden_dim=<span class="num">64</span>,
    num_classes=<span class="num">2</span>  <span class="cmt"># 正面/负面</span>
)</code></div>
      <div class="example-box">
        <div class="example-title">📝 文本预处理流程</div>
        <ul>
          <li>分词：<b>"我 喜欢 这部 电影"</b></li>
          <li>词表映射：<b>[23, 456, 789, 12]</b></li>
          <li>填充对齐：<b>[23, 456, 789, 12, 0, 0]</b></li>
          <li>送入 Embedding → LSTM → 分类</li>
        </ul>
      </div>
    `,
    init: () => {}
  },

  // 时间序列
  timeSeries: {
    theme: 'teal',
    badge: 'RNN',
    title: '实战：时间序列预测',
    render: () => `
      <p class="big-text">用 LSTM 预测<em>股票 / 气温</em>等时间序列</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">class</span> <span class="cls">TimeSeriesLSTM</span>(nn.Module):
    <span class="kw">def</span> <span class="fn">__init__</span>(self, input_dim=<span class="num">1</span>,
                 hidden_dim=<span class="num">32</span>, num_layers=<span class="num">2</span>):
        <span class="built">super</span>().__init__()
        self.lstm = nn.LSTM(
            input_dim, hidden_dim,
            num_layers, batch_first=<span class="kw">True</span>
        )
        self.fc = nn.Linear(hidden_dim, <span class="num">1</span>)

    <span class="kw">def</span> <span class="fn">forward</span>(self, x):
        <span class="cmt"># x: (batch, seq_len, 1)</span>
        out, _ = self.lstm(x)
        <span class="cmt"># 只取最后一个时间步</span>
        <span class="kw">return</span> self.fc(out[:, -<span class="num">1</span>, :])

<span class="cmt"># 创建滑动窗口数据集</span>
<span class="kw">def</span> <span class="fn">create_sequences</span>(data, seq_len=<span class="num">30</span>):
    xs, ys = [], []
    <span class="kw">for</span> i <span class="kw">in</span> range(<span class="built">len</span>(data) - seq_len):
        xs.append(data[i:i+seq_len])
        ys.append(data[i+seq_len])
    <span class="kw">return</span> torch.stack(xs), torch.stack(ys)

<span class="cmt"># 例：用过去 30 天预测第 31 天</span>
X, y = create_sequences(prices, seq_len=<span class="num">30</span>)
<span class="cmt"># X: (N, 30, 1), y: (N, 1)</span></code></div>
      <div class="tip-box">
        💡 时间序列需先做<b>归一化</b>（MinMaxScaler），预测后再反归一化
      </div>
    `,
    init: () => {}
  }
};

window.RNNCards = RNNCards;

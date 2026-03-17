// ===== 卡片模块：神经网络构建 =====

const NNCards = {
  // nn.Module 基础
  moduleBasics: {
    theme: 'blue',
    badge: '神经网络',
    title: 'nn.Module 基础',
    render: () => `
      <p class="big-text"><em>nn.Module</em> 是 PyTorch 中所有神经网络的基类</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">import</span> torch
<span class="kw">import</span> torch.nn <span class="kw">as</span> nn

<span class="kw">class</span> <span class="cls">SimpleNet</span>(nn.Module):
    <span class="kw">def</span> <span class="fn">__init__</span>(self):
        <span class="built">super</span>().__init__()
        self.fc1 = nn.Linear(<span class="num">784</span>, <span class="num">128</span>)  <span class="cmt"># 全连接层</span>
        self.fc2 = nn.Linear(<span class="num">128</span>, <span class="num">10</span>)

    <span class="kw">def</span> <span class="fn">forward</span>(self, x):
        x = torch.relu(self.fc1(x))
        x = self.fc2(x)
        <span class="kw">return</span> x

model = <span class="cls">SimpleNet</span>()
print(model)
<span class="cmt"># SimpleNet(
#   (fc1): Linear(in=784, out=128)
#   (fc2): Linear(in=128, out=10)
# )</span></code></div>
      <div class="step-list">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-content">继承 <b>nn.Module</b></div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-content">在 <b>__init__</b> 中定义层</div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-content">在 <b>forward</b> 中定义前向传播逻辑</div>
        </div>
      </div>
    `,
    init: () => {}
  },

  // 常用层
  commonLayers: {
    theme: 'green',
    badge: '神经网络',
    title: '常用网络层',
    render: () => `
      <table class="compare-table">
        <tr><th>层</th><th>用途</th><th>示例</th></tr>
        <tr><td><b>Linear</b></td><td>全连接</td><td>nn.Linear(256, 128)</td></tr>
        <tr><td><b>Conv2d</b></td><td>二维卷积</td><td>nn.Conv2d(3, 16, 3)</td></tr>
        <tr><td><b>LSTM</b></td><td>长短期记忆</td><td>nn.LSTM(100, 64)</td></tr>
        <tr><td><b>BatchNorm</b></td><td>批归一化</td><td>nn.BatchNorm2d(16)</td></tr>
        <tr><td><b>Dropout</b></td><td>随机失活</td><td>nn.Dropout(0.5)</td></tr>
        <tr><td><b>Embedding</b></td><td>词嵌入</td><td>nn.Embedding(1000, 64)</td></tr>
      </table>
      <div class="code-block"><span class="code-label">Python</span><code><span class="cmt"># 使用 Sequential 快速搭建</span>
model = nn.Sequential(
    nn.Linear(<span class="num">784</span>, <span class="num">256</span>),
    nn.ReLU(),
    nn.Dropout(<span class="num">0.3</span>),
    nn.Linear(<span class="num">256</span>, <span class="num">128</span>),
    nn.ReLU(),
    nn.Linear(<span class="num">128</span>, <span class="num">10</span>)
)

<span class="cmt"># 查看参数数量</span>
total = <span class="built">sum</span>(p.numel() <span class="kw">for</span> p <span class="kw">in</span> model.parameters())
print(<span class="str">f"参数总数: {total:,}"</span>)
<span class="cmt"># 参数总数: 235,146</span></code></div>
    `,
    init: () => {}
  },

  // 激活函数
  activations: {
    theme: 'purple',
    badge: '神经网络',
    title: '激活函数',
    render: () => `
      <p class="big-text">激活函数为网络引入<em>非线性</em>，是深度学习的关键</p>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feat-icon">⚡</div>
          <h4>ReLU</h4>
          <p>max(0, x)<br><span class="tag green">最常用</span></p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">📈</div>
          <h4>Sigmoid</h4>
          <p>1/(1+e⁻ˣ)<br><span class="tag blue">二分类输出</span></p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">〰️</div>
          <h4>Tanh</h4>
          <p>输出 [-1, 1]<br><span class="tag yellow">RNN 常用</span></p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">🔀</div>
          <h4>Softmax</h4>
          <p>输出概率分布<br><span class="tag red">多分类输出</span></p>
        </div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">import</span> torch.nn.functional <span class="kw">as</span> F

x = torch.randn(<span class="num">5</span>)

<span class="cmt"># 函数式调用</span>
print(F.relu(x))
print(F.sigmoid(x))
print(F.softmax(x, dim=<span class="num">0</span>))  <span class="cmt"># 概率之和 = 1</span>

<span class="cmt"># 模块式调用（用于 Sequential）</span>
relu = nn.ReLU()
print(relu(x))</code></div>
      <div class="tip-box">
        💡 隐藏层用 <b>ReLU</b>，输出层根据任务选择：二分类 → <b>Sigmoid</b>，多分类 → <b>Softmax</b>
      </div>
    `,
    init: () => {}
  },

  // 损失函数与优化器
  lossAndOptim: {
    theme: 'orange',
    badge: '神经网络',
    title: '损失函数 & 优化器',
    render: () => `
      <div class="two-col">
        <div class="col">
          <h3>📉 损失函数</h3>
          <p class="small">衡量预测与真实值的差距</p>
        </div>
        <div class="col">
          <h3>🎯 优化器</h3>
          <p class="small">根据梯度更新参数</p>
        </div>
      </div>
      <table class="compare-table">
        <tr><th>损失函数</th><th>适用场景</th></tr>
        <tr><td>MSELoss</td><td>回归任务</td></tr>
        <tr><td>CrossEntropyLoss</td><td>多分类</td></tr>
        <tr><td>BCELoss</td><td>二分类</td></tr>
        <tr><td>L1Loss</td><td>回归（MAE）</td></tr>
      </table>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">import</span> torch.optim <span class="kw">as</span> optim

model = <span class="cls">SimpleNet</span>()

<span class="cmt"># 定义损失函数</span>
criterion = nn.CrossEntropyLoss()

<span class="cmt"># 定义优化器</span>
optimizer = optim.Adam(
    model.parameters(),
    lr=<span class="num">0.001</span>,       <span class="cmt"># 学习率</span>
    weight_decay=<span class="num">1e-4</span>  <span class="cmt"># L2 正则化</span>
)

<span class="cmt"># SGD 优化器（经典）</span>
<span class="cmt"># optimizer = optim.SGD(model.parameters(),</span>
<span class="cmt">#                       lr=0.01, momentum=0.9)</span></code></div>
      <div class="tip-box">
        💡 <b>Adam</b> 是最常用的优化器，自适应学习率，收敛快。<b>SGD + Momentum</b> 更适合精调
      </div>
    `,
    init: () => {}
  }
};

window.NNCards = NNCards;

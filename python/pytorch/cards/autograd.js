// ===== 卡片模块：自动微分 =====

const AutogradCards = {
  // 概念
  concept: {
    theme: 'purple',
    badge: '自动微分',
    title: '什么是 Autograd？',
    render: () => `
      <p class="big-text">Autograd 是 PyTorch 的<em>自动微分引擎</em>，自动计算梯度</p>
      <div class="example-box">
        <div class="example-title">🎯 为什么需要梯度？</div>
        <p>深度学习的核心是<b>梯度下降</b>：通过计算损失函数对参数的梯度，不断更新参数使模型更准确</p>
      </div>
      <div class="flow-chart">
        <div class="flow-step">前向传播<br><span class="small">计算输出</span></div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">计算损失<br><span class="small">Loss</span></div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">反向传播<br><span class="small">求梯度</span></div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">更新参数<br><span class="small">优化</span></div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="cmt"># requires_grad=True 开启梯度追踪</span>
x = torch.tensor([<span class="num">2.0</span>], requires_grad=<span class="kw">True</span>)
y = x ** <span class="num">2</span> + <span class="num">3</span> * x + <span class="num">1</span>  <span class="cmt"># y = x² + 3x + 1</span>

y.backward()              <span class="cmt"># 反向传播，计算 dy/dx</span>
print(x.grad)             <span class="cmt"># tensor([7.]) → 2*2+3=7 ✓</span></code></div>
    `,
    init: () => {}
  },

  // 计算图
  computeGraph: {
    theme: 'indigo',
    badge: '自动微分',
    title: '计算图机制',
    render: () => `
      <p class="big-text">PyTorch 使用<em>动态计算图</em>记录运算过程</p>
      <div class="arch-stack">
        <div class="arch-layer top">损失值 loss (标量)</div>
        <div class="arch-layer mid">运算节点 (加、乘、激活...)</div>
        <div class="arch-layer bot">叶子节点 (参数 w, b)</div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="cmt"># 线性回归的一次前向+反向</span>
w = torch.tensor([<span class="num">1.0</span>], requires_grad=<span class="kw">True</span>)
b = torch.tensor([<span class="num">0.5</span>], requires_grad=<span class="kw">True</span>)
x = torch.tensor([<span class="num">2.0</span>])
y_true = torch.tensor([<span class="num">5.0</span>])

<span class="cmt"># 前向传播</span>
y_pred = w * x + b       <span class="cmt"># 2.5</span>
loss = (y_pred - y_true) ** <span class="num">2</span>  <span class="cmt"># (2.5-5)² = 6.25</span>

<span class="cmt"># 反向传播</span>
loss.backward()

print(w.grad)  <span class="cmt"># ∂loss/∂w = 2(wx+b-y)·x = -10</span>
print(b.grad)  <span class="cmt"># ∂loss/∂b = 2(wx+b-y)·1 = -5</span></code></div>
      <div class="tip-box">
        💡 <b>动态图</b>：每次前向传播重新构建计算图，方便调试和使用控制流（if/for）
      </div>
    `,
    init: () => {}
  },

  // 实战练习
  practice: {
    theme: 'green',
    badge: '自动微分',
    title: '实战：手写线性回归',
    render: () => `
      <p class="big-text">用 Autograd 从零实现线性回归</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">import</span> torch

<span class="cmt"># 1. 生成数据: y = 3x + 2 + 噪声</span>
torch.manual_seed(<span class="num">42</span>)
X = torch.rand(<span class="num">100</span>, <span class="num">1</span>) * <span class="num">10</span>
y = <span class="num">3</span> * X + <span class="num">2</span> + torch.randn(<span class="num">100</span>, <span class="num">1</span>)

<span class="cmt"># 2. 初始化参数</span>
w = torch.randn(<span class="num">1</span>, requires_grad=<span class="kw">True</span>)
b = torch.zeros(<span class="num">1</span>, requires_grad=<span class="kw">True</span>)
lr = <span class="num">0.001</span>

<span class="cmt"># 3. 训练循环</span>
<span class="kw">for</span> epoch <span class="kw">in</span> range(<span class="num">100</span>):
    y_pred = X * w + b
    loss = ((y_pred - y) ** <span class="num">2</span>).mean()

    loss.backward()       <span class="cmt"># 计算梯度</span>

    <span class="kw">with</span> torch.no_grad(): <span class="cmt"># 更新参数时不追踪</span>
        w -= lr * w.grad
        b -= lr * b.grad

    w.grad.zero_()        <span class="cmt"># 清零梯度！</span>
    b.grad.zero_()

print(<span class="str">f"w={w.item():.2f}, b={b.item():.2f}"</span>)
<span class="cmt"># 输出约: w=3.00, b=2.00 ✓</span></code></div>
      <div class="warn-box">
        ⚠️ 每次 backward() 后必须 <b>grad.zero_()</b> 清零梯度，否则梯度会累加！
      </div>
    `,
    init: () => {}
  }
};

window.AutogradCards = AutogradCards;

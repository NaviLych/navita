// ===== 卡片模块：基础入门 =====

const BasicsCards = {
  // 卡片: 什么是 PyTorch
  whatIsPyTorch: {
    theme: 'orange',
    badge: '入门',
    title: '什么是 PyTorch？',
    render: () => `
      <p class="big-text">一个由 <em>Meta (Facebook)</em> 开发的<strong>开源深度学习框架</strong>，以灵活性和易用性著称</p>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feat-icon">🔥</div>
          <h4>动态计算图</h4>
          <p>Define-by-Run，调试更直观</p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">🐍</div>
          <h4>Pythonic</h4>
          <p>API 风格贴近 Python 原生</p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">⚡</div>
          <h4>GPU 加速</h4>
          <p>CUDA 无缝切换</p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">🎓</div>
          <h4>学术首选</h4>
          <p>顶会论文使用率第一</p>
        </div>
      </div>
      <div class="tip-box">
        💡 PyTorch 的核心理念：<b>像写 Python 一样写深度学习代码</b>
      </div>
      <div class="swipe-hint">↑ 上滑继续</div>
    `,
    init: () => {}
  },

  // 卡片: 安装与环境
  installation: {
    theme: 'blue',
    badge: '入门',
    title: '安装与环境配置',
    render: () => `
      <p class="big-text">三步搞定 PyTorch 开发环境</p>
      <div class="step-list">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-content">
            <b>安装 Anaconda / Miniconda</b><br>
            推荐使用 conda 管理 Python 环境
          </div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-content">
            <b>创建虚拟环境</b>
          </div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-content">
            <b>安装 PyTorch</b>
          </div>
        </div>
      </div>
      <div class="code-block"><span class="code-label">Terminal</span><code><span class="cmt"># 创建并激活虚拟环境</span>
conda create -n pytorch_env python=3.11
conda activate pytorch_env

<span class="cmt"># 安装 PyTorch (GPU 版本)</span>
pip install torch torchvision torchaudio

<span class="cmt"># 验证安装</span>
python -c <span class="str">"import torch; print(torch.__version__)"</span></code></div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">import</span> torch

<span class="cmt"># 检查 CUDA 是否可用</span>
print(torch.cuda.is_available())  <span class="cmt"># True = GPU 可用</span>
print(torch.__version__)          <span class="cmt"># 如 2.1.0</span></code></div>
    `,
    init: () => {}
  },

  // 卡片: 第一个 Tensor
  firstTensor: {
    theme: 'green',
    badge: '入门',
    title: '你的第一个 Tensor',
    render: () => `
      <p class="big-text"><em>Tensor（张量）</em>是 PyTorch 的核心数据结构，类似 NumPy 的 ndarray</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">import</span> torch

<span class="cmt"># 从列表创建</span>
x = torch.tensor([<span class="num">1</span>, <span class="num">2</span>, <span class="num">3</span>])
print(x)           <span class="cmt"># tensor([1, 2, 3])</span>

<span class="cmt"># 创建 2x3 矩阵</span>
m = torch.tensor([[<span class="num">1</span>, <span class="num">2</span>, <span class="num">3</span>],
                   [<span class="num">4</span>, <span class="num">5</span>, <span class="num">6</span>]])
print(m.shape)     <span class="cmt"># torch.Size([2, 3])</span>

<span class="cmt"># 基本运算</span>
a = torch.tensor([<span class="num">1.0</span>, <span class="num">2.0</span>, <span class="num">3.0</span>])
b = torch.tensor([<span class="num">4.0</span>, <span class="num">5.0</span>, <span class="num">6.0</span>])
print(a + b)       <span class="cmt"># tensor([5., 7., 9.])</span>
print(a * b)       <span class="cmt"># tensor([ 4., 10., 18.])</span></code></div>
      <div class="two-col">
        <div class="col">
          <div class="icon-big">📊</div>
          <h3>vs NumPy</h3>
          <p class="small">API 几乎相同，但支持 GPU</p>
        </div>
        <div class="col">
          <div class="icon-big">🔄</div>
          <h3>互转</h3>
          <p class="small">tensor ↔ ndarray 无缝转换</p>
        </div>
      </div>
    `,
    init: () => {}
  }
};

window.BasicsCards = BasicsCards;

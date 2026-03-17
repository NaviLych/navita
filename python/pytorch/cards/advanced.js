// ===== 卡片模块：进阶技巧 =====

const AdvancedCards = {
  // 迁移学习
  transferLearning: {
    theme: 'purple',
    badge: '进阶',
    title: '迁移学习',
    render: () => `
      <p class="big-text">用<em>预训练模型</em>的知识加速新任务学习</p>
      <div class="example-box">
        <div class="example-title">🎯 为什么用迁移学习？</div>
        <ul>
          <li>自己的数据量<b>不够多</b></li>
          <li>从零训练需要<b>大量算力</b></li>
          <li>预训练模型已学会通用特征（边缘、纹理、形状）</li>
        </ul>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">import</span> torchvision.models <span class="kw">as</span> models

<span class="cmt"># 1. 加载预训练 ResNet18</span>
model = models.resnet18(
    weights=models.ResNet18_Weights.DEFAULT
)

<span class="cmt"># 2. 冻结所有参数</span>
<span class="kw">for</span> param <span class="kw">in</span> model.parameters():
    param.requires_grad = <span class="kw">False</span>

<span class="cmt"># 3. 替换最后的全连接层</span>
num_features = model.fc.in_features
model.fc = nn.Sequential(
    nn.Dropout(<span class="num">0.3</span>),
    nn.Linear(num_features, <span class="num">2</span>)  <span class="cmt"># 二分类</span>
)

<span class="cmt"># 4. 只训练新添加的层</span>
optimizer = optim.Adam(
    model.fc.parameters(), lr=<span class="num">1e-3</span>
)</code></div>
      <div class="step-list">
        <div class="step"><div class="step-num">1</div><div class="step-content">加载预训练权重</div></div>
        <div class="step"><div class="step-num">2</div><div class="step-content">冻结特征提取层</div></div>
        <div class="step"><div class="step-num">3</div><div class="step-content">替换分类头</div></div>
        <div class="step"><div class="step-num">4</div><div class="step-content">只微调新添加的层</div></div>
      </div>
    `,
    init: () => {}
  },

  // GPU 加速
  gpuAccel: {
    theme: 'red',
    badge: '进阶',
    title: 'GPU 加速训练',
    render: () => `
      <p class="big-text">将数据和模型放到 <em>GPU</em> 上，训练速度可提升 <strong>10-100 倍</strong></p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="cmt"># 设备选择</span>
device = torch.device(
    <span class="str">'cuda'</span> <span class="kw">if</span> torch.cuda.is_available()
    <span class="kw">else</span> <span class="str">'cpu'</span>
)
print(<span class="str">f"使用设备: {device}"</span>)

<span class="cmt"># 模型移到 GPU</span>
model = <span class="cls">CNN</span>().to(device)

<span class="cmt"># 数据移到 GPU（在训练循环中）</span>
<span class="kw">for</span> images, labels <span class="kw">in</span> train_loader:
    images = images.to(device)
    labels = labels.to(device)
    outputs = model(images)
    <span class="cmt">...</span></code></div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="cmt"># 多 GPU 训练（数据并行）</span>
<span class="kw">if</span> torch.cuda.device_count() > <span class="num">1</span>:
    model = nn.DataParallel(model)
    print(<span class="str">f"使用 {torch.cuda.device_count()} 块 GPU"</span>)

model = model.to(device)

<span class="cmt"># GPU 显存管理</span>
torch.cuda.empty_cache()  <span class="cmt"># 释放缓存</span>
print(torch.cuda.memory_summary())</code></div>
      <div class="warn-box">
        ⚠️ 数据和模型必须在<b>同一设备</b>上！忘记 <code>.to(device)</code> 是最常见的错误
      </div>
    `,
    init: () => {}
  },

  // 正则化
  regularization: {
    theme: 'orange',
    badge: '进阶',
    title: '正则化与调参技巧',
    render: () => `
      <p class="big-text">防止过拟合的常用武器库</p>
      <div class="feature-grid">
        <div class="feature-card">
          <div class="feat-icon">💧</div>
          <h4>Dropout</h4>
          <p>随机丢弃神经元</p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">📏</div>
          <h4>Weight Decay</h4>
          <p>L2 正则化</p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">📊</div>
          <h4>BatchNorm</h4>
          <p>归一化中间输出</p>
        </div>
        <div class="feature-card">
          <div class="feat-icon">📉</div>
          <h4>LR Scheduler</h4>
          <p>动态调整学习率</p>
        </div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="cmt"># 学习率调度器</span>
<span class="kw">from</span> torch.optim.lr_scheduler <span class="kw">import</span> (
    StepLR, CosineAnnealingLR, ReduceLROnPlateau
)

<span class="cmt"># 每 10 轮衰减 0.1</span>
scheduler = StepLR(optimizer, step_size=<span class="num">10</span>,
                   gamma=<span class="num">0.1</span>)

<span class="cmt"># 余弦退火</span>
scheduler = CosineAnnealingLR(
    optimizer, T_max=<span class="num">50</span>
)

<span class="cmt"># 自适应：验证 loss 不降时减小 lr</span>
scheduler = ReduceLROnPlateau(
    optimizer, mode=<span class="str">'min'</span>, patience=<span class="num">5</span>
)

<span class="cmt"># 在训练循环中使用</span>
<span class="kw">for</span> epoch <span class="kw">in</span> range(num_epochs):
    train(...)
    val_loss = evaluate(...)
    scheduler.step()  <span class="cmt"># 或 scheduler.step(val_loss)</span></code></div>
      <div class="tip-box">
        💡 <b>数据增强</b>也是一种有效的正则化手段！
      </div>
    `,
    init: () => {}
  }
};

window.AdvancedCards = AdvancedCards;

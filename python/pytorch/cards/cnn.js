// ===== 卡片模块：CNN 图像分类 =====

const CNNCards = {
  // 卷积原理
  convPrinciple: {
    theme: 'indigo',
    badge: 'CNN',
    title: '卷积神经网络原理',
    render: () => `
      <p class="big-text">CNN 通过<em>卷积核</em>自动提取图像特征</p>
      <div class="arch-stack">
        <div class="arch-layer top">全连接层 → 分类结果</div>
        <div class="arch-layer mid">池化层 → 降低维度</div>
        <div class="arch-layer mid">卷积层 → 提取特征</div>
        <div class="arch-layer bot">输入图像 (H×W×C)</div>
      </div>
      <div class="three-col">
        <div class="col">
          <div class="icon-big">🔍</div>
          <h3>卷积</h3>
          <p class="small">滑动窗口提取局部特征</p>
        </div>
        <div class="col">
          <div class="icon-big">📐</div>
          <h3>池化</h3>
          <p class="small">降采样，减少计算量</p>
        </div>
        <div class="col">
          <div class="icon-big">🧠</div>
          <h3>全连接</h3>
          <p class="small">综合特征做分类</p>
        </div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="cmt"># Conv2d 参数</span>
conv = nn.Conv2d(
    in_channels=<span class="num">3</span>,    <span class="cmt"># 输入通道 (RGB=3)</span>
    out_channels=<span class="num">16</span>,  <span class="cmt"># 输出通道（特征图数）</span>
    kernel_size=<span class="num">3</span>,    <span class="cmt"># 卷积核大小 3x3</span>
    stride=<span class="num">1</span>,          <span class="cmt"># 步幅</span>
    padding=<span class="num">1</span>          <span class="cmt"># 填充（保持尺寸）</span>
)

<span class="cmt"># 输出尺寸公式</span>
<span class="cmt"># H_out = (H_in + 2*padding - kernel) / stride + 1</span></code></div>
    `,
    init: () => {}
  },

  // 构建 CNN
  buildCNN: {
    theme: 'blue',
    badge: 'CNN',
    title: '构建 CNN 模型',
    render: () => `
      <p class="big-text">经典 CNN 架构：卷积 → 池化 → 全连接</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">class</span> <span class="cls">CNN</span>(nn.Module):
    <span class="kw">def</span> <span class="fn">__init__</span>(self, num_classes=<span class="num">10</span>):
        <span class="built">super</span>().__init__()
        <span class="cmt"># 特征提取</span>
        self.features = nn.Sequential(
            nn.Conv2d(<span class="num">3</span>, <span class="num">32</span>, <span class="num">3</span>, padding=<span class="num">1</span>),
            nn.BatchNorm2d(<span class="num">32</span>),
            nn.ReLU(),
            nn.MaxPool2d(<span class="num">2</span>),      <span class="cmt"># 32→16</span>

            nn.Conv2d(<span class="num">32</span>, <span class="num">64</span>, <span class="num">3</span>, padding=<span class="num">1</span>),
            nn.BatchNorm2d(<span class="num">64</span>),
            nn.ReLU(),
            nn.MaxPool2d(<span class="num">2</span>),      <span class="cmt"># 16→8</span>

            nn.Conv2d(<span class="num">64</span>, <span class="num">128</span>, <span class="num">3</span>, padding=<span class="num">1</span>),
            nn.BatchNorm2d(<span class="num">128</span>),
            nn.ReLU(),
            nn.AdaptiveAvgPool2d(<span class="num">1</span>) <span class="cmt"># →1x1</span>
        )
        <span class="cmt"># 分类器</span>
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(<span class="num">0.5</span>),
            nn.Linear(<span class="num">128</span>, num_classes)
        )

    <span class="kw">def</span> <span class="fn">forward</span>(self, x):
        x = self.features(x)
        x = self.classifier(x)
        <span class="kw">return</span> x</code></div>
      <div class="tip-box">
        💡 <b>BatchNorm</b> 加速收敛，<b>Dropout</b> 防过拟合，<b>AdaptiveAvgPool</b> 适配任意输入尺寸
      </div>
    `,
    init: () => {}
  },

  // CIFAR-10 实战
  cifar10: {
    theme: 'green',
    badge: 'CNN',
    title: '实战：CIFAR-10 分类',
    render: () => `
      <p class="big-text">用 CNN 对 <em>10 类彩色图像</em>进行分类</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">import</span> torchvision

<span class="cmt"># 数据准备</span>
transform = transforms.Compose([
    transforms.RandomHorizontalFlip(),
    transforms.RandomCrop(<span class="num">32</span>, padding=<span class="num">4</span>),
    transforms.ToTensor(),
    transforms.Normalize(
        (<span class="num">0.4914</span>, <span class="num">0.4822</span>, <span class="num">0.4465</span>),
        (<span class="num">0.2470</span>, <span class="num">0.2435</span>, <span class="num">0.2616</span>)
    )
])

train_set = torchvision.datasets.CIFAR10(
    <span class="str">'./data'</span>, train=<span class="kw">True</span>,
    download=<span class="kw">True</span>, transform=transform
)
train_loader = DataLoader(
    train_set, batch_size=<span class="num">128</span>, shuffle=<span class="kw">True</span>
)

<span class="cmt"># 训练</span>
model = <span class="cls">CNN</span>(num_classes=<span class="num">10</span>).to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), <span class="num">1e-3</span>)

<span class="kw">for</span> epoch <span class="kw">in</span> range(<span class="num">20</span>):
    loss = train_one_epoch(
        model, train_loader,
        criterion, optimizer, device
    )
    _, acc = evaluate(
        model, test_loader,
        criterion, device
    )
    print(<span class="str">f"Epoch {epoch+1} | "</span>
          <span class="str">f"Loss: {loss:.3f} | Acc: {acc:.1f}%"</span>)
<span class="cmt"># → 约 90%+ 准确率</span></code></div>
    `,
    init: () => {}
  }
};

window.CNNCards = CNNCards;

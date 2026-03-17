// ===== 卡片模块：实战项目 =====

const ProjectCards = {
  // MNIST 完整项目
  mnistProject: {
    theme: 'blue',
    badge: '实战',
    title: '完整项目：手写数字识别',
    render: () => `
      <p class="big-text">综合运用所学，完成 <em>MNIST</em> 手写数字分类</p>
      <div class="code-block"><span class="code-label">Python - 完整代码</span><code><span class="kw">import</span> torch
<span class="kw">import</span> torch.nn <span class="kw">as</span> nn
<span class="kw">import</span> torch.optim <span class="kw">as</span> optim
<span class="kw">from</span> torchvision <span class="kw">import</span> datasets, transforms
<span class="kw">from</span> torch.utils.data <span class="kw">import</span> DataLoader

<span class="cmt"># === 1. 配置 ===</span>
device = torch.device(<span class="str">'cuda'</span> <span class="kw">if</span>
    torch.cuda.is_available() <span class="kw">else</span> <span class="str">'cpu'</span>)
BATCH = <span class="num">128</span>
EPOCHS = <span class="num">10</span>
LR = <span class="num">1e-3</span>

<span class="cmt"># === 2. 数据 ===</span>
tf = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((<span class="num">0.1307</span>,), (<span class="num">0.3081</span>,))
])
train_ds = datasets.MNIST(<span class="str">'./data'</span>, <span class="kw">True</span>,
                          download=<span class="kw">True</span>, transform=tf)
test_ds  = datasets.MNIST(<span class="str">'./data'</span>, <span class="kw">False</span>,
                          transform=tf)
train_dl = DataLoader(train_ds, BATCH, shuffle=<span class="kw">True</span>)
test_dl  = DataLoader(test_ds, BATCH)

<span class="cmt"># === 3. 模型 ===</span>
<span class="kw">class</span> <span class="cls">MNISTNet</span>(nn.Module):
    <span class="kw">def</span> <span class="fn">__init__</span>(self):
        <span class="built">super</span>().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(<span class="num">1</span>,<span class="num">32</span>,<span class="num">3</span>,<span class="num">1</span>), nn.ReLU(),
            nn.Conv2d(<span class="num">32</span>,<span class="num">64</span>,<span class="num">3</span>,<span class="num">1</span>), nn.ReLU(),
            nn.MaxPool2d(<span class="num">2</span>),
            nn.Dropout2d(<span class="num">0.25</span>)
        )
        self.fc = nn.Sequential(
            nn.Flatten(),
            nn.Linear(<span class="num">9216</span>, <span class="num">128</span>), nn.ReLU(),
            nn.Dropout(<span class="num">0.5</span>),
            nn.Linear(<span class="num">128</span>, <span class="num">10</span>)
        )
    <span class="kw">def</span> <span class="fn">forward</span>(self, x):
        <span class="kw">return</span> self.fc(self.conv(x))

model = <span class="cls">MNISTNet</span>().to(device)
criterion = nn.CrossEntropyLoss()
optimizer = optim.Adam(model.parameters(), LR)</code></div>
      <div class="code-block"><span class="code-label">Python - 训练与测试</span><code><span class="cmt"># === 4. 训练 ===</span>
<span class="kw">for</span> epoch <span class="kw">in</span> range(EPOCHS):
    model.train()
    <span class="kw">for</span> imgs, labels <span class="kw">in</span> train_dl:
        imgs, labels = imgs.to(device), labels.to(device)
        out = model(imgs)
        loss = criterion(out, labels)
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

    <span class="cmt"># === 5. 测试 ===</span>
    model.eval()
    correct = total = <span class="num">0</span>
    <span class="kw">with</span> torch.no_grad():
        <span class="kw">for</span> imgs, labels <span class="kw">in</span> test_dl:
            imgs = imgs.to(device)
            labels = labels.to(device)
            pred = model(imgs).argmax(<span class="num">1</span>)
            correct += (pred == labels).sum().item()
            total += labels.size(<span class="num">0</span>)

    acc = <span class="num">100</span> * correct / total
    print(<span class="str">f"Epoch {epoch+1}/{EPOCHS} Acc: {acc:.1f}%"</span>)

<span class="cmt"># → 99%+ 准确率 🎉</span>
torch.save(model.state_dict(), <span class="str">'mnist_cnn.pth'</span>)</code></div>
    `,
    init: () => {}
  },

  // 情感分析完整项目
  sentimentProject: {
    theme: 'purple',
    badge: '实战',
    title: '完整项目：电影评论情感分析',
    render: () => `
      <p class="big-text">用 LSTM 分析 <em>IMDB</em> 电影评论的情感倾向</p>
      <div class="code-block"><span class="code-label">Python - 数据处理 & 模型</span><code><span class="kw">import</span> torch, torch.nn <span class="kw">as</span> nn

<span class="cmt"># === 1. 数据处理（简化版）===</span>
<span class="cmt"># 假设已有 tokenizer 和词表</span>
VOCAB_SIZE = <span class="num">20000</span>
MAX_LEN = <span class="num">200</span>

<span class="kw">def</span> <span class="fn">encode</span>(text, vocab, max_len=MAX_LEN):
    tokens = text.lower().split()
    ids = [vocab.get(w, <span class="num">1</span>) <span class="kw">for</span> w <span class="kw">in</span> tokens]
    <span class="cmt"># 截断或填充</span>
    ids = ids[:max_len]
    ids += [<span class="num">0</span>] * (max_len - <span class="built">len</span>(ids))
    <span class="kw">return</span> torch.tensor(ids)

<span class="cmt"># === 2. 模型 ===</span>
<span class="kw">class</span> <span class="cls">SentimentModel</span>(nn.Module):
    <span class="kw">def</span> <span class="fn">__init__</span>(self):
        <span class="built">super</span>().__init__()
        self.emb = nn.Embedding(VOCAB_SIZE, <span class="num">128</span>,
                                padding_idx=<span class="num">0</span>)
        self.lstm = nn.LSTM(<span class="num">128</span>, <span class="num">64</span>,
            num_layers=<span class="num">2</span>, batch_first=<span class="kw">True</span>,
            dropout=<span class="num">0.3</span>, bidirectional=<span class="kw">True</span>)
        self.fc = nn.Sequential(
            nn.Dropout(<span class="num">0.5</span>),
            nn.Linear(<span class="num">128</span>, <span class="num">1</span>),  <span class="cmt"># 64*2=128</span>
            nn.Sigmoid()
        )

    <span class="kw">def</span> <span class="fn">forward</span>(self, x):
        emb = self.emb(x)
        _, (h, _) = self.lstm(emb)
        <span class="cmt"># 拼接双向最后一层</span>
        h = torch.cat([h[-<span class="num">2</span>], h[-<span class="num">1</span>]], dim=<span class="num">1</span>)
        <span class="kw">return</span> self.fc(h).squeeze()

model = <span class="cls">SentimentModel</span>().to(device)
criterion = nn.BCELoss()
optimizer = optim.Adam(model.parameters(), <span class="num">1e-3</span>)
<span class="cmt"># 训练方式与 MNIST 项目类似</span>
<span class="cmt"># → 约 85-88% 准确率</span></code></div>
      <div class="example-box">
        <div class="example-title">🎓 学完本教程，你已掌握</div>
        <ul>
          <li>✅ Tensor 创建与操作</li>
          <li>✅ 自动微分与计算图</li>
          <li>✅ 神经网络构建 (nn.Module)</li>
          <li>✅ 数据加载与预处理</li>
          <li>✅ 完整训练流程</li>
          <li>✅ CNN 图像分类</li>
          <li>✅ RNN/LSTM 序列处理</li>
          <li>✅ 迁移学习与 GPU 加速</li>
        </ul>
      </div>
    `,
    init: () => {}
  }
};

window.ProjectCards = ProjectCards;

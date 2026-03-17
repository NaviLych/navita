// ===== 卡片模块：数据处理 =====

const DataCards = {
  // Dataset 与 DataLoader
  datasetLoader: {
    theme: 'teal',
    badge: '数据',
    title: 'Dataset & DataLoader',
    render: () => `
      <p class="big-text">PyTorch 数据管道的两大核心组件</p>
      <div class="two-col">
        <div class="col">
          <div class="icon-big">📦</div>
          <h3>Dataset</h3>
          <p class="small">存储样本和标签，支持索引访问</p>
        </div>
        <div class="col">
          <div class="icon-big">🔄</div>
          <h3>DataLoader</h3>
          <p class="small">批量加载、打乱、多进程读取</p>
        </div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> torchvision <span class="kw">import</span> datasets, transforms
<span class="kw">from</span> torch.utils.data <span class="kw">import</span> DataLoader

<span class="cmt"># 下载 MNIST 数据集</span>
transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize((<span class="num">0.5</span>,), (<span class="num">0.5</span>,))
])

train_data = datasets.MNIST(
    root=<span class="str">'./data'</span>,
    train=<span class="kw">True</span>,
    download=<span class="kw">True</span>,
    transform=transform
)

<span class="cmt"># 创建 DataLoader</span>
train_loader = DataLoader(
    train_data,
    batch_size=<span class="num">64</span>,     <span class="cmt"># 每批 64 个样本</span>
    shuffle=<span class="kw">True</span>,       <span class="cmt"># 每轮打乱顺序</span>
    num_workers=<span class="num">2</span>      <span class="cmt"># 多进程加载</span>
)

<span class="cmt"># 遍历一个批次</span>
images, labels = <span class="built">next</span>(<span class="built">iter</span>(train_loader))
print(images.shape)  <span class="cmt"># [64, 1, 28, 28]</span>
print(labels.shape)  <span class="cmt"># [64]</span></code></div>
    `,
    init: () => {}
  },

  // 数据变换
  transforms: {
    theme: 'green',
    badge: '数据',
    title: '数据变换 Transforms',
    render: () => `
      <p class="big-text">用 <em>transforms</em> 做数据预处理和增强</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> torchvision <span class="kw">import</span> transforms

<span class="cmt"># 训练集：数据增强 + 标准化</span>
train_transform = transforms.Compose([
    transforms.RandomResizedCrop(<span class="num">224</span>),
    transforms.RandomHorizontalFlip(),
    transforms.ColorJitter(
        brightness=<span class="num">0.2</span>,
        contrast=<span class="num">0.2</span>
    ),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[<span class="num">0.485</span>, <span class="num">0.456</span>, <span class="num">0.406</span>],
        std=[<span class="num">0.229</span>, <span class="num">0.224</span>, <span class="num">0.225</span>]
    )
])

<span class="cmt"># 测试集：只做标准化</span>
test_transform = transforms.Compose([
    transforms.Resize(<span class="num">256</span>),
    transforms.CenterCrop(<span class="num">224</span>),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[<span class="num">0.485</span>, <span class="num">0.456</span>, <span class="num">0.406</span>],
        std=[<span class="num">0.229</span>, <span class="num">0.224</span>, <span class="num">0.225</span>]
    )
])</code></div>
      <div class="example-box">
        <div class="example-title">🎨 常用变换</div>
        <ul>
          <li><b>RandomCrop</b> - 随机裁剪</li>
          <li><b>RandomHorizontalFlip</b> - 随机水平翻转</li>
          <li><b>ColorJitter</b> - 颜色抖动</li>
          <li><b>Normalize</b> - 标准化（ImageNet 均值/标准差）</li>
        </ul>
      </div>
    `,
    init: () => {}
  },

  // 自定义数据集
  customDataset: {
    theme: 'purple',
    badge: '数据',
    title: '自定义数据集',
    render: () => `
      <p class="big-text">实现自己的 Dataset 只需<em>三个方法</em></p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">from</span> torch.utils.data <span class="kw">import</span> Dataset
<span class="kw">from</span> PIL <span class="kw">import</span> Image
<span class="kw">import</span> os

<span class="kw">class</span> <span class="cls">DogCatDataset</span>(Dataset):
    <span class="kw">def</span> <span class="fn">__init__</span>(self, root_dir, transform=<span class="kw">None</span>):
        self.root_dir = root_dir
        self.transform = transform
        self.images = os.listdir(root_dir)

    <span class="kw">def</span> <span class="fn">__len__</span>(self):
        <span class="kw">return</span> <span class="built">len</span>(self.images)

    <span class="kw">def</span> <span class="fn">__getitem__</span>(self, idx):
        img_name = self.images[idx]
        img_path = os.path.join(
            self.root_dir, img_name
        )
        image = Image.open(img_path)
        <span class="cmt"># dog_001.jpg → label=0</span>
        label = <span class="num">0</span> <span class="kw">if</span> <span class="str">'dog'</span> <span class="kw">in</span> img_name <span class="kw">else</span> <span class="num">1</span>

        <span class="kw">if</span> self.transform:
            image = self.transform(image)
        <span class="kw">return</span> image, label

<span class="cmt"># 使用</span>
dataset = <span class="cls">DogCatDataset</span>(<span class="str">'./pets'</span>, transform)
loader = DataLoader(dataset, batch_size=<span class="num">32</span>)</code></div>
      <div class="step-list">
        <div class="step"><div class="step-num">1</div><div class="step-content"><b>__init__</b>：初始化文件路径列表</div></div>
        <div class="step"><div class="step-num">2</div><div class="step-content"><b>__len__</b>：返回数据集大小</div></div>
        <div class="step"><div class="step-num">3</div><div class="step-content"><b>__getitem__</b>：加载并返回单个样本</div></div>
      </div>
    `,
    init: () => {}
  }
};

window.DataCards = DataCards;

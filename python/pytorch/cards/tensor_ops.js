// ===== 卡片模块：张量操作 =====

const TensorCards = {
  // 张量创建
  creation: {
    theme: 'blue',
    badge: '张量',
    title: '张量创建方法',
    render: () => `
      <p class="big-text">PyTorch 提供多种方式创建 Tensor</p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">import</span> torch

<span class="cmt"># 全零 / 全一</span>
zeros = torch.zeros(<span class="num">3</span>, <span class="num">4</span>)        <span class="cmt"># 3x4 全零矩阵</span>
ones  = torch.ones(<span class="num">2</span>, <span class="num">3</span>)         <span class="cmt"># 2x3 全一矩阵</span>

<span class="cmt"># 随机数</span>
rand  = torch.rand(<span class="num">3</span>, <span class="num">3</span>)         <span class="cmt"># [0,1) 均匀分布</span>
randn = torch.randn(<span class="num">3</span>, <span class="num">3</span>)        <span class="cmt"># 标准正态分布</span>

<span class="cmt"># 等差序列</span>
seq   = torch.arange(<span class="num">0</span>, <span class="num">10</span>, <span class="num">2</span>)   <span class="cmt"># tensor([0, 2, 4, 6, 8])</span>
lin   = torch.linspace(<span class="num">0</span>, <span class="num">1</span>, <span class="num">5</span>)  <span class="cmt"># 5 个均匀点</span>

<span class="cmt"># 单位矩阵</span>
eye   = torch.eye(<span class="num">3</span>)              <span class="cmt"># 3x3 单位矩阵</span>

<span class="cmt"># 指定数据类型</span>
x = torch.tensor([<span class="num">1</span>, <span class="num">2</span>], dtype=torch.float32)</code></div>
      <div class="tip-box">
        💡 <b>torch.rand</b> 用于初始化权重，<b>torch.zeros</b> 用于初始化偏置
      </div>
    `,
    init: () => {}
  },

  // 张量运算
  operations: {
    theme: 'green',
    badge: '张量',
    title: '张量运算',
    render: () => `
      <p class="big-text">常用数学运算一览</p>
      <div class="code-block"><span class="code-label">Python</span><code>a = torch.tensor([[<span class="num">1.</span>, <span class="num">2.</span>], [<span class="num">3.</span>, <span class="num">4.</span>]])
b = torch.tensor([[<span class="num">5.</span>, <span class="num">6.</span>], [<span class="num">7.</span>, <span class="num">8.</span>]])

<span class="cmt"># 逐元素运算</span>
print(a + b)            <span class="cmt"># 加法</span>
print(a * b)            <span class="cmt"># 逐元素乘法</span>
print(torch.sqrt(a))    <span class="cmt"># 开方</span>

<span class="cmt"># 矩阵乘法（三种等价写法）</span>
c = a @ b               <span class="cmt"># 推荐写法</span>
c = torch.matmul(a, b)
c = a.mm(b)

<span class="cmt"># 聚合运算</span>
print(a.sum())          <span class="cmt"># 所有元素求和</span>
print(a.mean())         <span class="cmt"># 平均值</span>
print(a.max())          <span class="cmt"># 最大值</span>
print(a.argmax())       <span class="cmt"># 最大值的索引</span>

<span class="cmt"># 沿维度聚合</span>
print(a.sum(dim=<span class="num">0</span>))    <span class="cmt"># 按列求和 → [4, 6]</span>
print(a.sum(dim=<span class="num">1</span>))    <span class="cmt"># 按行求和 → [3, 7]</span></code></div>
      <div class="example-box">
        <div class="example-title">📝 记忆技巧</div>
        <p><b>@</b> 是矩阵乘法，<b>*</b> 是逐元素乘法</p>
        <p><b>dim=0</b> 沿行方向（按列），<b>dim=1</b> 沿列方向（按行）</p>
      </div>
    `,
    init: () => {}
  },

  // 索引与切片
  indexing: {
    theme: 'purple',
    badge: '张量',
    title: '索引与切片',
    render: () => `
      <p class="big-text">和 NumPy 完全一致的索引方式</p>
      <div class="code-block"><span class="code-label">Python</span><code>x = torch.arange(<span class="num">12</span>).reshape(<span class="num">3</span>, <span class="num">4</span>)
<span class="cmt"># tensor([[ 0,  1,  2,  3],
#         [ 4,  5,  6,  7],
#         [ 8,  9, 10, 11]])</span>

<span class="cmt"># 基础索引</span>
print(x[<span class="num">0</span>])          <span class="cmt"># 第 0 行 → [0,1,2,3]</span>
print(x[<span class="num">1</span>, <span class="num">2</span>])       <span class="cmt"># 第 1 行第 2 列 → 6</span>

<span class="cmt"># 切片</span>
print(x[:<span class="num">2</span>, <span class="num">1</span>:])     <span class="cmt"># 前 2 行，第 1 列起</span>
print(x[::2, :])      <span class="cmt"># 每隔一行</span>

<span class="cmt"># 布尔索引</span>
mask = x > <span class="num">5</span>
print(x[mask])        <span class="cmt"># 大于 5 的元素</span>

<span class="cmt"># 花式索引</span>
idx = torch.tensor([<span class="num">0</span>, <span class="num">2</span>])
print(x[idx])         <span class="cmt"># 选第 0、2 行</span></code></div>
      <div class="warn-box">
        ⚠️ 切片返回的是<b>视图（view）</b>，修改会影响原始张量！用 <b>.clone()</b> 拷贝副本
      </div>
    `,
    init: () => {}
  },

  // 形状变换
  reshaping: {
    theme: 'orange',
    badge: '张量',
    title: '形状变换',
    render: () => `
      <p class="big-text">灵活变换 Tensor 的形状是深度学习的基本功</p>
      <div class="code-block"><span class="code-label">Python</span><code>x = torch.arange(<span class="num">12</span>)

<span class="cmt"># reshape / view</span>
a = x.reshape(<span class="num">3</span>, <span class="num">4</span>)    <span class="cmt"># 3x4</span>
b = x.view(<span class="num">2</span>, <span class="num">6</span>)       <span class="cmt"># 2x6</span>
c = x.reshape(<span class="num">3</span>, -<span class="num">1</span>)   <span class="cmt"># -1 自动推算 → 3x4</span>

<span class="cmt"># 转置</span>
m = torch.randn(<span class="num">2</span>, <span class="num">3</span>)
print(m.T)              <span class="cmt"># 转置 → 3x2</span>
print(m.permute(<span class="num">1</span>, <span class="num">0</span>)) <span class="cmt"># 交换维度</span>

<span class="cmt"># 增加 / 去除维度</span>
a = torch.randn(<span class="num">3</span>, <span class="num">4</span>)
b = a.unsqueeze(<span class="num">0</span>)      <span class="cmt"># 1x3x4</span>
c = b.squeeze(<span class="num">0</span>)        <span class="cmt"># 3x4</span>

<span class="cmt"># 拼接</span>
x = torch.ones(<span class="num">2</span>, <span class="num">3</span>)
y = torch.zeros(<span class="num">2</span>, <span class="num">3</span>)
print(torch.cat([x, y], dim=<span class="num">0</span>))  <span class="cmt"># 4x3</span>
print(torch.stack([x, y]))        <span class="cmt"># 2x2x3</span></code></div>
      <table class="compare-table">
        <tr><th>方法</th><th>作用</th><th>注意</th></tr>
        <tr><td><b>view</b></td><td>改变形状</td><td>需连续内存</td></tr>
        <tr><td><b>reshape</b></td><td>改变形状</td><td>更安全</td></tr>
        <tr><td><b>permute</b></td><td>交换维度</td><td>多维转置</td></tr>
        <tr><td><b>cat</b></td><td>拼接</td><td>沿已有维度</td></tr>
        <tr><td><b>stack</b></td><td>堆叠</td><td>新增维度</td></tr>
      </table>
    `,
    init: () => {}
  }
};

window.TensorCards = TensorCards;

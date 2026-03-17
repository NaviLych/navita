// ===== 卡片模块：训练流程 =====

const TrainingCards = {
  // 完整训练循环
  trainLoop: {
    theme: 'red',
    badge: '训练',
    title: '完整训练循环',
    render: () => `
      <p class="big-text">训练神经网络的<em>标准五步循环</em></p>
      <div class="flow-chart">
        <div class="flow-step">前向传播</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">计算损失</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">清零梯度</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">反向传播</div>
        <div class="flow-arrow">→</div>
        <div class="flow-step">更新参数</div>
      </div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">def</span> <span class="fn">train_one_epoch</span>(model, loader, criterion,
                      optimizer, device):
    model.train()  <span class="cmt"># 切换到训练模式</span>
    total_loss = <span class="num">0</span>

    <span class="kw">for</span> images, labels <span class="kw">in</span> loader:
        images = images.to(device)
        labels = labels.to(device)

        <span class="cmt"># 1. 前向传播</span>
        outputs = model(images)

        <span class="cmt"># 2. 计算损失</span>
        loss = criterion(outputs, labels)

        <span class="cmt"># 3. 清零梯度</span>
        optimizer.zero_grad()

        <span class="cmt"># 4. 反向传播</span>
        loss.backward()

        <span class="cmt"># 5. 更新参数</span>
        optimizer.step()

        total_loss += loss.item()

    <span class="kw">return</span> total_loss / <span class="built">len</span>(loader)</code></div>
      <div class="warn-box">
        ⚠️ <b>optimizer.zero_grad()</b> 必须在 backward() 之前调用！
      </div>
    `,
    init: () => {}
  },

  // 模型验证
  validation: {
    theme: 'blue',
    badge: '训练',
    title: '模型验证与评估',
    render: () => `
      <p class="big-text">用验证集监控模型，防止<em>过拟合</em></p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="kw">def</span> <span class="fn">evaluate</span>(model, loader, criterion, device):
    model.eval()  <span class="cmt"># 切换到评估模式</span>
    total_loss = <span class="num">0</span>
    correct = <span class="num">0</span>
    total = <span class="num">0</span>

    <span class="kw">with</span> torch.no_grad():  <span class="cmt"># 不计算梯度</span>
        <span class="kw">for</span> images, labels <span class="kw">in</span> loader:
            images = images.to(device)
            labels = labels.to(device)

            outputs = model(images)
            loss = criterion(outputs, labels)
            total_loss += loss.item()

            <span class="cmt"># 计算准确率</span>
            _, predicted = outputs.max(<span class="num">1</span>)
            total += labels.size(<span class="num">0</span>)
            correct += predicted.eq(labels).sum().item()

    avg_loss = total_loss / <span class="built">len</span>(loader)
    accuracy = <span class="num">100.</span> * correct / total
    <span class="kw">return</span> avg_loss, accuracy</code></div>
      <div class="two-col">
        <div class="col">
          <h3>model.train()</h3>
          <p class="small">启用 Dropout、BatchNorm 训练行为</p>
        </div>
        <div class="col">
          <h3>model.eval()</h3>
          <p class="small">关闭 Dropout，BatchNorm 用全局统计</p>
        </div>
      </div>
      <div class="tip-box">
        💡 验证时务必使用 <b>torch.no_grad()</b>，节省内存并加速计算
      </div>
    `,
    init: () => {}
  },

  // 保存与加载
  saveLoad: {
    theme: 'green',
    badge: '训练',
    title: '保存与加载模型',
    render: () => `
      <p class="big-text">两种保存方式，推荐保存 <em>state_dict</em></p>
      <div class="code-block"><span class="code-label">Python</span><code><span class="cmt"># ✅ 推荐：只保存参数</span>
torch.save(model.state_dict(), <span class="str">'model.pth'</span>)

<span class="cmt"># 加载参数</span>
model = <span class="cls">SimpleNet</span>()
model.load_state_dict(
    torch.load(<span class="str">'model.pth'</span>)
)
model.eval()

<span class="cmt"># ❌ 不推荐：保存整个模型</span>
<span class="cmt"># torch.save(model, 'model.pth')</span>
<span class="cmt"># model = torch.load('model.pth')</span></code></div>
      <div class="code-block"><span class="code-label">Python</span><code><span class="cmt"># 保存 checkpoint（断点续训）</span>
checkpoint = {
    <span class="str">'epoch'</span>: epoch,
    <span class="str">'model_state'</span>: model.state_dict(),
    <span class="str">'optim_state'</span>: optimizer.state_dict(),
    <span class="str">'loss'</span>: best_loss,
}
torch.save(checkpoint, <span class="str">'checkpoint.pth'</span>)

<span class="cmt"># 恢复训练</span>
ckpt = torch.load(<span class="str">'checkpoint.pth'</span>)
model.load_state_dict(ckpt[<span class="str">'model_state'</span>])
optimizer.load_state_dict(ckpt[<span class="str">'optim_state'</span>])
start_epoch = ckpt[<span class="str">'epoch'</span>] + <span class="num">1</span></code></div>
      <div class="example-box">
        <div class="example-title">💾 最佳实践</div>
        <ul>
          <li>保存验证集上 loss 最低的模型（Early Stopping）</li>
          <li>使用 checkpoint 保存训练状态，方便断点续训</li>
          <li>部署时用 <b>model.eval()</b> + <b>torch.no_grad()</b></li>
        </ul>
      </div>
    `,
    init: () => {}
  }
};

window.TrainingCards = TrainingCards;

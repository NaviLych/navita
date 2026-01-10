// 骰子决策器应用
class DiceApp {
    constructor() {
        this.diceCount = 1;
        this.maxDice = 6;
        this.minDice = 1;
        this.isRolling = false;
        this.audioContext = null;
        this.audioEnabled = false;
        this.activeRangeIndex = 0;
        this.tempRanges = [];
        
        // 颜色方案
        this.colors = [
            'linear-gradient(135deg, #667eea, #764ba2)',
            'linear-gradient(135deg, #f093fb, #f5576c)',
            'linear-gradient(135deg, #4facfe, #00f2fe)',
            'linear-gradient(135deg, #43e97b, #38f9d7)',
            'linear-gradient(135deg, #fa709a, #fee140)',
            'linear-gradient(135deg, #ff9a9e, #fecfef)'
        ];

        // 加载或初始化范围配置
        this.rangeConfig = this.loadRangeConfig() || this.getDefaultRangeConfig();
        
        this.initElements();
        this.initEventListeners();
        this.renderDice();
        this.updateRangeHint();
    }

    // 获取默认范围配置
    getDefaultRangeConfig() {
        return {
            ranges: [
                { min: 1, max: 2, decision: '再来一次' },
                { min: 3, max: 4, decision: '选项 A' },
                { min: 5, max: 6, decision: '选项 B' }
            ]
        };
    }

    // 从本地存储加载配置
    loadRangeConfig() {
        const saved = localStorage.getItem('diceRangeConfig');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    // 保存配置到本地存储
    saveRangeConfig() {
        localStorage.setItem('diceRangeConfig', JSON.stringify(this.rangeConfig));
    }

    initElements() {
        this.diceCountEl = document.getElementById('diceCount');
        this.diceContainer = document.getElementById('diceContainer');
        this.diceArena = document.getElementById('diceArena');
        this.rollButton = document.getElementById('rollButton');
        this.addDiceBtn = document.getElementById('addDice');
        this.removeDiceBtn = document.getElementById('removeDice');
        this.totalPointsEl = document.getElementById('totalPoints');
        this.decisionResultEl = document.getElementById('decisionResult');
        this.rangeHintEl = document.getElementById('rangeHint');
        this.settingsOverlay = document.getElementById('settingsOverlay');
        this.rangeTrack = document.getElementById('rangeTrack');
        this.rangeScale = document.getElementById('rangeScale');
        this.decisionEditor = document.getElementById('decisionEditor');
        this.closeSettingsBtn = document.getElementById('closeSettings');
        this.saveSettingsBtn = document.getElementById('saveSettings');
        this.addRangeBtn = document.getElementById('addRange');
        this.removeRangeBtn = document.getElementById('removeRange');
        this.soundNotice = document.getElementById('soundNotice');
    }

    initEventListeners() {
        this.addDiceBtn.addEventListener('click', () => this.changeDiceCount(1));
        this.removeDiceBtn.addEventListener('click', () => this.changeDiceCount(-1));
        this.rollButton.addEventListener('click', () => this.rollDice());
        this.closeSettingsBtn.addEventListener('click', () => this.closeSettings());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        this.addRangeBtn.addEventListener('click', () => this.addRange());
        this.removeRangeBtn.addEventListener('click', () => this.removeRange());
        
        // 点击遮罩关闭设置
        this.settingsOverlay.addEventListener('click', (e) => {
            if (e.target === this.settingsOverlay) {
                this.closeSettings();
            }
        });

        // 启用音效
        document.addEventListener('click', () => this.enableAudio(), { once: true });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isRolling && !this.settingsOverlay.classList.contains('active')) {
                e.preventDefault();
                this.rollDice();
            }
            if (e.code === 'Escape' && this.settingsOverlay.classList.contains('active')) {
                this.closeSettings();
            }
        });
    }

    // 启用音频
    enableAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioEnabled = true;
            this.soundNotice.classList.add('hidden');
        }
    }

    // 播放骰子声音
    playDiceSound() {
        if (!this.audioEnabled || !this.audioContext) return;

        // 创建多个短促的点击声模拟骰子滚动
        const playClick = (time, frequency, duration) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime + time);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + time + duration);
            
            oscillator.start(this.audioContext.currentTime + time);
            oscillator.stop(this.audioContext.currentTime + time + duration);
        };

        // 模拟骰子滚动声
        for (let i = 0; i < 8; i++) {
            const freq = 200 + Math.random() * 300;
            playClick(i * 0.07, freq, 0.05);
        }
    }

    // 播放结果声音
    playResultSound() {
        if (!this.audioEnabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
        oscillator.frequency.setValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
        oscillator.frequency.setValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.4);
    }

    // 播放拖拽声音
    playDragSound() {
        if (!this.audioEnabled || !this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = 600 + Math.random() * 200;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.03);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.03);
    }

    changeDiceCount(delta) {
        const newCount = this.diceCount + delta;
        if (newCount >= this.minDice && newCount <= this.maxDice) {
            this.diceCount = newCount;
            this.diceCountEl.textContent = this.diceCount;
            this.renderDice();
            this.updateRangeHint();
            this.totalPointsEl.textContent = '-';
            this.decisionResultEl.textContent = '点击投掷开始';
        }
    }

    updateRangeHint() {
        const max = this.diceCount * 6;
        this.rangeHintEl.textContent = `点数范围: ${this.diceCount} - ${max}`;
    }

    // 渲染骰子
    renderDice() {
        this.diceContainer.innerHTML = '';
        
        for (let i = 0; i < this.diceCount; i++) {
            const dice = document.createElement('div');
            dice.className = 'dice';
            dice.dataset.index = i;
            dice.innerHTML = this.createDiceFace(1);
            dice.addEventListener('click', () => this.openSettings());
            this.diceContainer.appendChild(dice);
        }
    }

    // 创建骰子点数面
    createDiceFace(value) {
        const dotPatterns = {
            1: [0, 0, 0, 0, 1, 0, 0, 0, 0],
            2: [1, 0, 0, 0, 0, 0, 0, 0, 1],
            3: [1, 0, 0, 0, 1, 0, 0, 0, 1],
            4: [1, 0, 1, 0, 0, 0, 1, 0, 1],
            5: [1, 0, 1, 0, 1, 0, 1, 0, 1],
            6: [1, 0, 1, 1, 0, 1, 1, 0, 1]
        };

        const pattern = dotPatterns[value] || dotPatterns[1];
        const dots = pattern.map((show, index) => 
            `<div class="dot ${show ? '' : 'hidden'}"></div>`
        ).join('');

        return `<div class="dice-face"><div class="dice-dots">${dots}</div></div>`;
    }

    // 投掷骰子
    async rollDice() {
        if (this.isRolling) return;
        
        this.isRolling = true;
        this.rollButton.classList.add('rolling');
        this.diceArena.classList.add('rolling');
        
        const diceElements = document.querySelectorAll('.dice');
        const results = [];
        
        // 播放滚动声音
        this.playDiceSound();
        
        // 添加滚动动画
        diceElements.forEach(dice => {
            dice.classList.add('rolling');
        });

        // 模拟滚动过程中的数字变化
        for (let frame = 0; frame < 10; frame++) {
            await this.wait(60);
            diceElements.forEach(dice => {
                const randomValue = Math.floor(Math.random() * 6) + 1;
                dice.innerHTML = this.createDiceFace(randomValue);
            });
        }

        // 最终结果
        await this.wait(100);
        diceElements.forEach((dice, index) => {
            dice.classList.remove('rolling');
            const finalValue = Math.floor(Math.random() * 6) + 1;
            results.push(finalValue);
            dice.innerHTML = this.createDiceFace(finalValue);
        });

        // 计算总分
        const total = results.reduce((sum, val) => sum + val, 0);
        
        // 显示结果
        this.totalPointsEl.textContent = total;
        this.decisionResultEl.textContent = this.findDecision(total);
        
        // 添加高亮动画
        document.querySelector('.result-section').classList.add('highlight');
        setTimeout(() => {
            document.querySelector('.result-section').classList.remove('highlight');
        }, 500);

        // 播放结果声音
        this.playResultSound();

        this.isRolling = false;
        this.rollButton.classList.remove('rolling');
        this.diceArena.classList.remove('rolling');
    }

    // 查找决策
    findDecision(points) {
        const maxPoints = this.diceCount * 6;
        const minPoints = this.diceCount;
        
        // 将点数归一化到 1-6 范围
        const normalizedPoint = Math.round(((points - minPoints) / (maxPoints - minPoints)) * 5) + 1;
        
        // 根据归一化位置查找对应区间
        for (const range of this.rangeConfig.ranges) {
            if (normalizedPoint >= range.min && normalizedPoint <= range.max) {
                return range.decision;
            }
        }
        
        return this.rangeConfig.ranges[this.rangeConfig.ranges.length - 1]?.decision || '未设置';
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // 打开设置面板
    openSettings() {
        if (this.isRolling) return;
        
        this.activeRangeIndex = 0;
        this.tempRanges = JSON.parse(JSON.stringify(this.rangeConfig.ranges));
        this.renderSettingsPanel();
        this.settingsOverlay.classList.add('active');
    }

    // 关闭设置面板
    closeSettings() {
        this.settingsOverlay.classList.remove('active');
    }

    // 渲染设置面板
    renderSettingsPanel() {
        this.renderRangeTrack();
        this.renderRangeScale();
        this.renderDecisionEditor();
        this.updateActionButtons();
    }

    // 渲染范围轨道
    renderRangeTrack() {
        this.rangeTrack.innerHTML = '';
        
        let currentTop = 0;

        this.tempRanges.forEach((range, index) => {
            const rangeSize = range.max - range.min + 1;
            const heightPercent = (rangeSize / 6) * 100;
            
            // 创建区间块
            const segment = document.createElement('div');
            segment.className = `range-segment ${index === this.activeRangeIndex ? 'active' : ''}`;
            segment.style.top = `${currentTop}%`;
            segment.style.height = `${heightPercent}%`;
            segment.style.background = this.colors[index % this.colors.length];
            segment.dataset.index = index;
            
            const label = document.createElement('span');
            label.className = 'segment-label';
            label.textContent = range.decision || `区间 ${index + 1}`;
            segment.appendChild(label);
            
            segment.addEventListener('click', () => {
                this.activeRangeIndex = index;
                this.renderSettingsPanel();
            });
            
            this.rangeTrack.appendChild(segment);
            
            // 添加分隔拖拽手柄（除了最后一个）
            if (index < this.tempRanges.length - 1) {
                const divider = document.createElement('div');
                divider.className = 'range-divider';
                divider.style.top = `calc(${currentTop + heightPercent}% - 10px)`;
                divider.dataset.index = index;
                
                this.setupDividerDrag(divider, index);
                this.rangeTrack.appendChild(divider);
            }
            
            currentTop += heightPercent;
        });
    }

    // 设置分隔线拖拽
    setupDividerDrag(divider, index) {
        let startY, startTop, lastPoint;
        let isDragging = false;

        const onStart = (e) => {
            e.preventDefault();
            isDragging = true;
            startY = e.clientY || e.touches?.[0]?.clientY;
            startTop = parseFloat(divider.style.top);
            lastPoint = this.tempRanges[index].max;
            divider.classList.add('dragging');
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
        };

        const onMove = (e) => {
            if (!isDragging) return;
            
            const clientY = e.clientY || e.touches?.[0]?.clientY;
            const trackRect = this.rangeTrack.getBoundingClientRect();
            
            // 计算在轨道中的相对位置（0-1）
            const relativeY = (clientY - trackRect.top) / trackRect.height;
            
            // 转换为点数（1-6）
            let newPoint = Math.round(relativeY * 6);
            newPoint = Math.max(this.tempRanges[index].min, Math.min(this.tempRanges[index + 1].max - 1, newPoint));
            
            if (newPoint !== lastPoint && newPoint >= 1 && newPoint <= 5) {
                lastPoint = newPoint;
                this.playDragSound();
                
                // 更新范围
                this.tempRanges[index].max = newPoint;
                this.tempRanges[index + 1].min = newPoint + 1;
                
                this.renderRangeTrack();
                this.renderRangeScale();
                this.renderDecisionEditor();
            }
        };

        const onEnd = () => {
            if (!isDragging) return;
            isDragging = false;
            divider.classList.remove('dragging');
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        divider.addEventListener('mousedown', onStart);
        divider.addEventListener('touchstart', onStart, { passive: false });
        document.addEventListener('mousemove', onMove);
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('mouseup', onEnd);
        document.addEventListener('touchend', onEnd);
    }

    // 渲染刻度线
    renderRangeScale() {
        this.rangeScale.innerHTML = '';
        
        for (let i = 1; i <= 6; i++) {
            const mark = document.createElement('div');
            mark.className = 'scale-mark';
            
            // 检查是否是边界点
            const isBoundary = this.tempRanges.some(r => r.min === i || r.max === i);
            if (isBoundary) {
                mark.classList.add('highlight');
            }
            if (i === 1 || i === 6) {
                mark.classList.add('major');
            }
            
            mark.innerHTML = `<span class="tick"></span><span>${i}</span>`;
            this.rangeScale.appendChild(mark);
        }
    }

    // 渲染决策编辑器
    renderDecisionEditor() {
        this.decisionEditor.innerHTML = '';
        
        this.tempRanges.forEach((range, index) => {
            const item = document.createElement('div');
            item.className = `decision-item ${index === this.activeRangeIndex ? 'active' : ''}`;
            item.style.animationDelay = `${index * 0.05}s`;
            
            const colorDot = document.createElement('div');
            colorDot.className = 'decision-color';
            colorDot.style.background = this.colors[index % this.colors.length];
            
            const rangeLabel = document.createElement('span');
            rangeLabel.className = 'decision-range';
            rangeLabel.textContent = range.min === range.max ? `${range.min}` : `${range.min} - ${range.max}`;
            
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'decision-input';
            input.value = range.decision;
            input.placeholder = '输入决策内容...';
            input.addEventListener('input', (e) => {
                this.tempRanges[index].decision = e.target.value;
                // 更新轨道上的标签
                const segment = this.rangeTrack.querySelector(`.range-segment[data-index="${index}"] .segment-label`);
                if (segment) {
                    segment.textContent = e.target.value || `区间 ${index + 1}`;
                }
            });
            input.addEventListener('focus', () => {
                if (this.activeRangeIndex !== index) {
                    this.activeRangeIndex = index;
                    this.renderSettingsPanel();
                }
            });
            
            item.appendChild(colorDot);
            item.appendChild(rangeLabel);
            item.appendChild(input);
            
            item.addEventListener('click', (e) => {
                if (e.target !== input) {
                    this.activeRangeIndex = index;
                    this.renderSettingsPanel();
                    item.querySelector('input')?.focus();
                }
            });
            
            this.decisionEditor.appendChild(item);
        });
    }

    // 添加区间
    addRange() {
        if (this.tempRanges.length >= 6) return;
        
        // 找到最大的区间进行分割
        let maxRangeIndex = 0;
        let maxRangeSize = 0;
        
        this.tempRanges.forEach((range, index) => {
            const size = range.max - range.min + 1;
            if (size > maxRangeSize) {
                maxRangeSize = size;
                maxRangeIndex = index;
            }
        });
        
        if (maxRangeSize < 2) return;
        
        const rangeToSplit = this.tempRanges[maxRangeIndex];
        const splitPoint = Math.floor((rangeToSplit.min + rangeToSplit.max) / 2);
        
        const newRange = {
            min: splitPoint + 1,
            max: rangeToSplit.max,
            decision: `新选项 ${this.tempRanges.length + 1}`
        };
        
        rangeToSplit.max = splitPoint;
        
        this.tempRanges.splice(maxRangeIndex + 1, 0, newRange);
        this.activeRangeIndex = maxRangeIndex + 1;
        
        this.renderSettingsPanel();
    }

    // 删除区间
    removeRange() {
        if (this.tempRanges.length <= 1) return;
        
        const removedRange = this.tempRanges.splice(this.activeRangeIndex, 1)[0];
        
        if (this.activeRangeIndex > 0) {
            this.tempRanges[this.activeRangeIndex - 1].max = removedRange.max;
            this.activeRangeIndex--;
        } else if (this.tempRanges.length > 0) {
            this.tempRanges[0].min = removedRange.min;
        }
        
        this.renderSettingsPanel();
    }

    // 更新操作按钮状态
    updateActionButtons() {
        this.addRangeBtn.disabled = this.tempRanges.length >= 6;
        this.removeRangeBtn.disabled = this.tempRanges.length <= 1;
    }

    // 保存设置
    saveSettings() {
        this.rangeConfig.ranges = this.tempRanges;
        this.saveRangeConfig();
        this.closeSettings();
        this.showToast('设置已保存 ✓');
    }

    // 显示提示
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'sound-notice';
        toast.textContent = message;
        toast.style.background = 'rgba(34, 197, 94, 0.9)';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('hidden');
            setTimeout(() => toast.remove(), 300);
        }, 2000);
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.diceApp = new DiceApp();
});

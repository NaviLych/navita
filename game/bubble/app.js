// 游戏配置
const CONFIG = {
    sizes: {
        small: { bubbleSize: 28, cols: 10, rows: 12 },
        medium: { bubbleSize: 38, cols: 8, rows: 10 },
        large: { bubbleSize: 50, cols: 6, rows: 8 }
    },
    comboTimeout: 500, // 连击判定时间(ms)
    particleCount: 8,
    particleColors: ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd']
};

// 音效系统
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.init();
    }
    
    init() {
        // 延迟初始化 AudioContext（需要用户交互）
        const initAudio = () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            document.removeEventListener('touchstart', initAudio);
            document.removeEventListener('mousedown', initAudio);
        };
        document.addEventListener('touchstart', initAudio);
        document.addEventListener('mousedown', initAudio);
    }
    
    // 戳泡泡音效 - 仿真真实泡泡纸声音
    playPop(pitch = 1) {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 随机化参数，让每次声音略有不同
        const randomPitch = pitch * (0.9 + Math.random() * 0.2);
        const randomDuration = 0.03 + Math.random() * 0.02;
        
        // === 第一层：初始爆破声（塑料膜破裂的瞬间冲击） ===
        const popDuration = 0.015;
        const popBuffer = ctx.createBuffer(1, ctx.sampleRate * popDuration, ctx.sampleRate);
        const popData = popBuffer.getChannelData(0);
        
        for (let i = 0; i < popBuffer.length; i++) {
            const t = i / popBuffer.length;
            // 极快速的指数衰减 + 随机噪声 = 爆破声
            const envelope = Math.exp(-t * 30);
            popData[i] = (Math.random() * 2 - 1) * envelope;
        }
        
        const popSource = ctx.createBufferSource();
        popSource.buffer = popBuffer;
        
        // 带通滤波 - 突出中高频的"啵"声特征
        const popBandpass = ctx.createBiquadFilter();
        popBandpass.type = 'bandpass';
        popBandpass.frequency.value = 2000 * randomPitch;
        popBandpass.Q.value = 1.5;
        
        const popGain = ctx.createGain();
        popGain.gain.value = 0.6;
        
        popSource.connect(popBandpass);
        popBandpass.connect(popGain);
        popGain.connect(ctx.destination);
        
        // === 第二层：空气释放声（嘶嘶声） ===
        const airDuration = randomDuration;
        const airBuffer = ctx.createBuffer(1, ctx.sampleRate * airDuration, ctx.sampleRate);
        const airData = airBuffer.getChannelData(0);
        
        for (let i = 0; i < airBuffer.length; i++) {
            const t = i / airBuffer.length;
            // 更自然的衰减曲线
            const envelope = Math.pow(1 - t, 3);
            // 高频噪声模拟空气泄漏
            airData[i] = (Math.random() * 2 - 1) * envelope * 0.4;
        }
        
        const airSource = ctx.createBufferSource();
        airSource.buffer = airBuffer;
        
        // 高通滤波 - 只保留高频嘶嘶声
        const airHighpass = ctx.createBiquadFilter();
        airHighpass.type = 'highpass';
        airHighpass.frequency.value = 4000;
        
        const airGain = ctx.createGain();
        airGain.gain.value = 0.25;
        
        airSource.connect(airHighpass);
        airHighpass.connect(airGain);
        airGain.connect(ctx.destination);
        
        // === 第三层：低频冲击（塑料膜的振动） ===
        const thumpOsc = ctx.createOscillator();
        thumpOsc.type = 'sine';
        thumpOsc.frequency.setValueAtTime(150 * randomPitch, now);
        thumpOsc.frequency.exponentialRampToValueAtTime(50, now + 0.03);
        
        const thumpGain = ctx.createGain();
        thumpGain.gain.setValueAtTime(0.15, now);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
        
        thumpOsc.connect(thumpGain);
        thumpGain.connect(ctx.destination);
        
        // === 第四层：塑料膜的轻微共振 ===
        const resonanceOsc = ctx.createOscillator();
        resonanceOsc.type = 'triangle';
        resonanceOsc.frequency.setValueAtTime(800 * randomPitch + Math.random() * 200, now);
        resonanceOsc.frequency.exponentialRampToValueAtTime(400 * randomPitch, now + 0.02);
        
        const resonanceGain = ctx.createGain();
        resonanceGain.gain.setValueAtTime(0.08, now);
        resonanceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
        
        resonanceOsc.connect(resonanceGain);
        resonanceGain.connect(ctx.destination);
        
        // 播放所有层
        popSource.start(now);
        airSource.start(now + 0.005); // 稍微延迟空气声
        thumpOsc.start(now);
        thumpOsc.stop(now + 0.03);
        resonanceOsc.start(now);
        resonanceOsc.stop(now + 0.025);
    }
    
    // 连击音效
    playCombo(comboCount) {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 根据连击数提高音调
        const baseFreq = 400 + (comboCount * 50);
        
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(baseFreq, now);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.05);
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.15);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 0.15);
    }
    
    // 完成庆祝音效
    playCelebration() {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 播放一组上升音符
        const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
        
        notes.forEach((freq, index) => {
            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.value = freq;
            
            const gain = ctx.createGain();
            const startTime = now + index * 0.1;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// 特效系统
class EffectsManager {
    constructor() {
        this.container = document.getElementById('popEffects');
    }
    
    // 创建弹出粒子
    createParticles(x, y) {
        for (let i = 0; i < CONFIG.particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'pop-particle';
            
            // 随机方向和距离
            const angle = (Math.PI * 2 / CONFIG.particleCount) * i + Math.random() * 0.5;
            const distance = 30 + Math.random() * 40;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.cssText = `
                left: ${x}px;
                top: ${y}px;
                background: ${CONFIG.particleColors[Math.floor(Math.random() * CONFIG.particleColors.length)]};
                --tx: ${tx}px;
                --ty: ${ty}px;
            `;
            
            this.container.appendChild(particle);
            
            // 动画结束后移除
            setTimeout(() => particle.remove(), 600);
        }
    }
    
    // 显示连击提示
    showCombo(x, y, combo) {
        const burst = document.createElement('div');
        burst.className = 'combo-burst';
        burst.textContent = `${combo}连击! 🔥`;
        burst.style.cssText = `
            left: ${x}px;
            top: ${y}px;
        `;
        
        this.container.appendChild(burst);
        setTimeout(() => burst.remove(), 800);
    }
    
    // 显示完成庆祝
    showCelebration() {
        const celebration = document.createElement('div');
        celebration.className = 'celebration';
        celebration.innerHTML = '🎉 完美! 🎉<br><span style="font-size: 1.5rem">全部戳完啦~</span>';
        
        this.container.appendChild(celebration);
        setTimeout(() => celebration.remove(), 1500);
    }
}

// 主游戏类
class BubbleWrapGame {
    constructor() {
        this.bubbleWrap = document.getElementById('bubbleWrap');
        this.popCountEl = document.getElementById('popCount');
        this.comboDisplayEl = document.getElementById('comboDisplay');
        this.soundManager = new SoundManager();
        this.effectsManager = new EffectsManager();
        
        this.currentSize = 'medium';
        this.isZenMode = false;
        this.popCount = 0;
        this.combo = 0;
        this.lastPopTime = 0;
        this.totalBubbles = 0;
        this.poppedBubbles = 0;
        
        this.init();
    }
    
    init() {
        this.createBubbles();
        this.bindEvents();
    }
    
    createBubbles() {
        const config = CONFIG.sizes[this.currentSize];
        this.bubbleWrap.innerHTML = '';
        this.bubbleWrap.className = `bubble-wrap ${this.currentSize}`;
        this.bubbleWrap.style.setProperty('--bubble-size', `${config.bubbleSize}px`);
        
        this.totalBubbles = config.cols * config.rows;
        this.poppedBubbles = 0;
        
        for (let i = 0; i < this.totalBubbles; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble' + (this.isZenMode ? ' rainbow' : '');
            bubble.dataset.index = i;
            
            // 添加触摸和点击事件
            bubble.addEventListener('click', (e) => this.popBubble(e, bubble));
            bubble.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.popBubble(e, bubble);
            }, { passive: false });
            
            this.bubbleWrap.appendChild(bubble);
        }
    }
    
    popBubble(event, bubble) {
        if (bubble.classList.contains('popped')) return;
        
        // 标记为已戳
        bubble.classList.add('popping');
        setTimeout(() => {
            bubble.classList.remove('popping');
            bubble.classList.add('popped');
        }, 200);
        
        // 更新计数
        this.popCount++;
        this.poppedBubbles++;
        this.popCountEl.textContent = this.popCount;
        
        // 获取位置用于特效
        const rect = bubble.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        
        // 处理连击
        const now = Date.now();
        if (now - this.lastPopTime < CONFIG.comboTimeout) {
            this.combo++;
            if (this.combo >= 3) {
                this.comboDisplayEl.textContent = `${this.combo}连击!`;
                this.comboDisplayEl.classList.add('active');
                this.effectsManager.showCombo(x, y, this.combo);
                this.soundManager.playCombo(this.combo);
            }
        } else {
            this.combo = 1;
            this.comboDisplayEl.classList.remove('active');
        }
        this.lastPopTime = now;
        
        // 播放音效（根据连击调整音调）
        const pitch = 1 + (this.combo * 0.05);
        this.soundManager.playPop(pitch);
        
        // 创建粒子特效
        this.effectsManager.createParticles(x, y);
        
        // 检查是否全部戳完
        if (this.poppedBubbles === this.totalBubbles) {
            setTimeout(() => {
                this.effectsManager.showCelebration();
                this.soundManager.playCelebration();
            }, 300);
        }
        
        // 禅模式自动恢复
        if (this.isZenMode) {
            setTimeout(() => {
                bubble.classList.remove('popped');
            }, 2000);
        }
    }
    
    reset() {
        this.popCount = 0;
        this.combo = 0;
        this.poppedBubbles = 0;
        this.popCountEl.textContent = '0';
        this.comboDisplayEl.classList.remove('active');
        this.createBubbles();
    }
    
    setSize(size) {
        if (this.currentSize === size) return;
        this.currentSize = size;
        
        // 更新按钮状态
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.size === size);
        });
        
        this.reset();
    }
    
    toggleMode() {
        this.isZenMode = !this.isZenMode;
        const modeBtn = document.getElementById('modeToggle');
        
        if (this.isZenMode) {
            modeBtn.textContent = '🧘 禅模式';
            modeBtn.classList.add('zen');
        } else {
            modeBtn.textContent = '🎯 普通模式';
            modeBtn.classList.remove('zen');
        }
        
        // 更新泡泡样式
        document.querySelectorAll('.bubble').forEach(bubble => {
            bubble.classList.toggle('rainbow', this.isZenMode);
        });
    }
    
    bindEvents() {
        // 重置按钮
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        
        // 音效开关
        const soundBtn = document.getElementById('soundToggle');
        soundBtn.addEventListener('click', () => {
            const enabled = this.soundManager.toggle();
            soundBtn.textContent = enabled ? '🔊 音效' : '🔇 静音';
            soundBtn.classList.toggle('muted', !enabled);
        });
        
        // 模式切换
        document.getElementById('modeToggle').addEventListener('click', () => this.toggleMode());
        
        // 大小选择
        document.querySelectorAll('.size-btn').forEach(btn => {
            btn.addEventListener('click', () => this.setSize(btn.dataset.size));
        });
        
        // 防止双击缩放
        document.addEventListener('dblclick', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            switch(e.key.toLowerCase()) {
                case 'r':
                    this.reset();
                    break;
                case 's':
                    soundBtn.click();
                    break;
                case 'm':
                    this.toggleMode();
                    break;
                case '1':
                    this.setSize('small');
                    break;
                case '2':
                    this.setSize('medium');
                    break;
                case '3':
                    this.setSize('large');
                    break;
            }
        });
    }
}

// 启动游戏
document.addEventListener('DOMContentLoaded', () => {
    new BubbleWrapGame();
});

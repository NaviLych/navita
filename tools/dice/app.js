// 骰子应用
class DiceApp {
    constructor() {
        this.diceCount = 1;
        this.maxDice = 6;
        this.minDice = 1;
        this.isRolling = false;
        this.audioContext = null;
        this.audioEnabled = false;
        
        this.initElements();
        this.initEventListeners();
        this.renderDice();
        this.updateRangeHint();
    }

    initElements() {
        this.diceCountEl = document.getElementById('diceCount');
        this.diceContainer = document.getElementById('diceContainer');
        this.diceArena = document.getElementById('diceArena');
        this.rollButton = document.getElementById('rollButton');
        this.addDiceBtn = document.getElementById('addDice');
        this.removeDiceBtn = document.getElementById('removeDice');
        this.totalPointsEl = document.getElementById('totalPoints');
        this.rangeHintEl = document.getElementById('rangeHint');
        this.soundNotice = document.getElementById('soundNotice');
    }

    initEventListeners() {
        this.addDiceBtn.addEventListener('click', () => this.changeDiceCount(1));
        this.removeDiceBtn.addEventListener('click', () => this.changeDiceCount(-1));
        this.rollButton.addEventListener('click', () => this.rollDice());

        // 启用音效
        document.addEventListener('click', () => this.enableAudio(), { once: true });
        
        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isRolling) {
                e.preventDefault();
                this.rollDice();
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

    changeDiceCount(delta) {
        const newCount = this.diceCount + delta;
        if (newCount >= this.minDice && newCount <= this.maxDice) {
            this.diceCount = newCount;
            this.diceCountEl.textContent = this.diceCount;
            this.renderDice();
            this.updateRangeHint();
            this.totalPointsEl.textContent = '-';
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

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.diceApp = new DiceApp();
});

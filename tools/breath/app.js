// 呼吸光环应用
class BreathApp {
    constructor() {
        // 状态管理
        this.isRunning = false;
        this.isPaused = false;
        this.currentPhase = 'idle'; // idle, inhale, hold, exhale
        this.remainingTime = 180; // 3 minutes in seconds
        this.phaseTimer = null;
        this.countdownTimer = null;

        // 音频
        this.audioContext = null;
        this.audioEnabled = false;
        this.currentSound = 'none';
        this.soundVolume = 0.5;
        this.oscillator = null;
        this.gainNode = null;

        // 呼吸模式
        this.rhythmMode = '478';
        this.rhythmPatterns = {
            '478': { inhale: 4, hold: 7, exhale: 8 },
            'box': { inhale: 4, hold: 4, exhale: 4, holdAfter: 4 },
            'custom': { inhale: 4, hold: 4, exhale: 4 }
        };

        // 加载保存的设置
        this.loadSettings();

        // 初始化
        this.initElements();
        this.initEventListeners();
        this.updateUI();
    }

    initElements() {
        // 控制面板
        this.controlPanel = document.getElementById('controlPanel');
        this.closePanelBtn = document.getElementById('closePanel');
        this.showPanelBtn = document.getElementById('showPanelBtn');

        // 呼吸模式
        this.rhythmBtns = document.querySelectorAll('.rhythm-btn');
        this.rhythmInfo = document.getElementById('rhythmInfo');
        this.customSettings = document.getElementById('customSettings');
        this.customInhale = document.getElementById('customInhale');
        this.customHold = document.getElementById('customHold');
        this.customExhale = document.getElementById('customExhale');

        // 音效控制
        this.soundBtns = document.querySelectorAll('.sound-btn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');

        // 其他控制
        this.darkModeBtn = document.getElementById('darkModeBtn');
        this.fullscreenBtn = document.getElementById('fullscreenBtn');

        // 呼吸画布
        this.breathCircle = document.getElementById('breathCircle');
        this.breathText = document.getElementById('breathText');
        this.breathTimer = document.getElementById('breathTimer');

        // 主按钮
        this.mainButton = document.getElementById('mainButton');

        // 音效提示
        this.soundNotice = document.getElementById('soundNotice');
    }

    initEventListeners() {
        // 控制面板切换
        this.closePanelBtn.addEventListener('click', () => this.togglePanel(false));
        this.showPanelBtn.addEventListener('click', () => this.togglePanel(true));

        // 呼吸模式选择
        this.rhythmBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const rhythm = btn.dataset.rhythm;
                this.setRhythm(rhythm);
            });
        });

        // 自定义模式输入
        [this.customInhale, this.customHold, this.customExhale].forEach(input => {
            input.addEventListener('change', () => this.updateCustomRhythm());
        });

        // 音效选择
        this.soundBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const sound = btn.dataset.sound;
                this.setSound(sound);
            });
        });

        // 音量控制
        this.volumeSlider.addEventListener('input', (e) => {
            this.soundVolume = e.target.value / 100;
            this.volumeValue.textContent = `${e.target.value}%`;
            if (this.gainNode) {
                this.gainNode.gain.value = this.soundVolume;
            }
            this.saveSettings();
        });

        // 夜间模式
        this.darkModeBtn.addEventListener('click', () => this.toggleDarkMode());

        // 全屏
        this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

        // 主按钮
        this.mainButton.addEventListener('click', () => this.toggleBreathing());

        // 启用音频
        document.addEventListener('click', () => this.enableAudio(), { once: true });

        // 键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.toggleBreathing();
            } else if (e.code === 'Escape' && this.isRunning) {
                this.stopBreathing();
            }
        });
    }

    // 控制面板切换
    togglePanel(show) {
        if (show) {
            this.controlPanel.classList.remove('hidden');
            this.showPanelBtn.classList.remove('visible');
        } else {
            this.controlPanel.classList.add('hidden');
            this.showPanelBtn.classList.add('visible');
        }
    }

    // 设置呼吸模式
    setRhythm(rhythm) {
        if (this.isRunning && !this.isPaused) return;

        this.rhythmMode = rhythm;
        this.rhythmBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.rhythm === rhythm);
        });

        // 显示/隐藏自定义设置
        this.customSettings.classList.toggle('active', rhythm === 'custom');

        this.updateRhythmInfo();
        this.updateBreathAnimation();
        this.saveSettings();
    }

    // 更新自定义呼吸模式
    updateCustomRhythm() {
        this.rhythmPatterns.custom = {
            inhale: parseInt(this.customInhale.value) || 4,
            hold: parseInt(this.customHold.value) || 4,
            exhale: parseInt(this.customExhale.value) || 4
        };
        this.updateRhythmInfo();
        this.updateBreathAnimation();
        this.saveSettings();
    }

    // 更新呼吸模式信息
    updateRhythmInfo() {
        const pattern = this.rhythmPatterns[this.rhythmMode];
        let info = '';

        if (this.rhythmMode === '478') {
            info = `吸气 ${pattern.inhale} 秒 → 屏息 ${pattern.hold} 秒 → 呼气 ${pattern.exhale} 秒`;
        } else if (this.rhythmMode === 'box') {
            info = `吸气 ${pattern.inhale} 秒 → 屏息 ${pattern.hold} 秒 → 呼气 ${pattern.exhale} 秒 → 屏息 ${pattern.holdAfter} 秒`;
        } else {
            info = `吸气 ${pattern.inhale} 秒 → 屏息 ${pattern.hold} 秒 → 呼气 ${pattern.exhale} 秒`;
        }

        this.rhythmInfo.textContent = info;
    }

    // 设置环境音
    setSound(sound) {
        this.currentSound = sound;
        this.soundBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sound === sound);
        });

        if (this.isRunning) {
            this.stopAmbientSound();
            if (sound !== 'none') {
                this.playAmbientSound(sound);
            }
        }

        this.saveSettings();
    }

    // 切换夜间模式
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        this.darkModeBtn.classList.toggle('active');
        this.saveSettings();
    }

    // 切换全屏
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('无法进入全屏:', err);
            });
            this.fullscreenBtn.classList.add('active');
        } else {
            document.exitFullscreen();
            this.fullscreenBtn.classList.remove('active');
        }
    }

    // 启用音频
    enableAudio() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.audioEnabled = true;
            
            // 显示提示
            this.soundNotice.classList.add('show');
            setTimeout(() => {
                this.soundNotice.classList.remove('show');
            }, 2000);
        }
    }

    // 播放环境音
    playAmbientSound(type) {
        if (!this.audioContext || !this.audioEnabled) return;

        this.stopAmbientSound();

        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = this.soundVolume;
        this.gainNode.connect(this.audioContext.destination);

        if (type === 'wind') {
            // 风声 - 使用白噪音 + 低频滤波
            const bufferSize = 2 * this.audioContext.sampleRate;
            const noiseBuffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const output = noiseBuffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const whiteNoise = this.audioContext.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            const lowpass = this.audioContext.createBiquadFilter();
            lowpass.type = 'lowpass';
            lowpass.frequency.value = 500;

            whiteNoise.connect(lowpass);
            lowpass.connect(this.gainNode);
            whiteNoise.start();

            this.oscillator = whiteNoise;
        } else if (type === 'wave') {
            // 海浪声 - 使用振荡器 + LFO
            const osc1 = this.audioContext.createOscillator();
            const osc2 = this.audioContext.createOscillator();
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();

            osc1.type = 'sine';
            osc1.frequency.value = 80;
            osc2.type = 'sine';
            osc2.frequency.value = 120;

            lfo.type = 'sine';
            lfo.frequency.value = 0.2;
            lfoGain.gain.value = 30;

            lfo.connect(lfoGain);
            lfoGain.connect(osc1.frequency);
            lfoGain.connect(osc2.frequency);

            const merger = this.audioContext.createChannelMerger(2);
            osc1.connect(merger, 0, 0);
            osc2.connect(merger, 0, 1);
            merger.connect(this.gainNode);

            osc1.start();
            osc2.start();
            lfo.start();

            this.oscillator = { osc1, osc2, lfo };
        }
    }

    // 停止环境音
    stopAmbientSound() {
        if (this.oscillator) {
            try {
                if (this.oscillator.stop) {
                    this.oscillator.stop();
                } else {
                    // 多个振荡器
                    Object.values(this.oscillator).forEach(osc => {
                        if (osc.stop) osc.stop();
                    });
                }
            } catch (e) {
                console.error('停止音频失败:', e);
            }
            this.oscillator = null;
        }
        if (this.gainNode) {
            this.gainNode.disconnect();
            this.gainNode = null;
        }
    }

    // 切换呼吸练习
    toggleBreathing() {
        if (!this.isRunning) {
            this.startBreathing();
        } else if (this.isPaused) {
            this.resumeBreathing();
        } else {
            this.pauseBreathing();
        }
    }

    // 开始呼吸练习
    startBreathing() {
        this.isRunning = true;
        this.isPaused = false;
        this.remainingTime = 180;
        this.breathCircle.classList.add('breathing');
        this.mainButton.querySelector('.button-text').textContent = '暂停';
        
        // 开始环境音
        if (this.currentSound !== 'none') {
            this.playAmbientSound(this.currentSound);
        }

        // 开始呼吸循环
        this.startBreathCycle();

        // 开始倒计时
        this.startCountdown();

        // 隐藏控制面板
        this.togglePanel(false);
    }

    // 暂停呼吸练习
    pauseBreathing() {
        this.isPaused = true;
        this.mainButton.querySelector('.button-text').textContent = '继续';
        this.breathText.textContent = '已暂停';
        
        clearTimeout(this.phaseTimer);
        clearInterval(this.countdownTimer);
        this.stopAmbientSound();
    }

    // 恢复呼吸练习
    resumeBreathing() {
        this.isPaused = false;
        this.mainButton.querySelector('.button-text').textContent = '暂停';
        
        if (this.currentSound !== 'none') {
            this.playAmbientSound(this.currentSound);
        }

        this.startBreathCycle();
        this.startCountdown();
    }

    // 停止呼吸练习
    stopBreathing() {
        this.isRunning = false;
        this.isPaused = false;
        this.currentPhase = 'idle';
        this.remainingTime = 180;
        this.breathCircle.classList.remove('breathing');
        this.breathText.textContent = '点击开始';
        this.breathTimer.textContent = '3:00';
        this.mainButton.querySelector('.button-text').textContent = '开始';
        
        clearTimeout(this.phaseTimer);
        clearInterval(this.countdownTimer);
        this.stopAmbientSound();
    }

    // 开始呼吸循环
    startBreathCycle() {
        const pattern = this.rhythmPatterns[this.rhythmMode];
        
        const executePhase = (phase, duration, nextPhase) => {
            this.currentPhase = phase;
            this.updatePhaseText(phase);
            
            this.phaseTimer = setTimeout(() => {
                if (!this.isPaused && this.isRunning) {
                    nextPhase();
                }
            }, duration * 1000);
        };

        const inhale = () => {
            executePhase('inhale', pattern.inhale, hold);
        };

        const hold = () => {
            executePhase('hold', pattern.hold, exhale);
        };

        const exhale = () => {
            const duration = pattern.exhale;
            const next = (this.rhythmMode === 'box') ? holdAfter : complete;
            executePhase('exhale', duration, next);
        };

        const holdAfter = () => {
            executePhase('holdAfter', pattern.holdAfter, complete);
        };

        const complete = () => {
            if (this.remainingTime > 0) {
                inhale();
            } else {
                this.stopBreathing();
            }
        };

        inhale();
    }

    // 更新阶段文本
    updatePhaseText(phase) {
        const textMap = {
            'inhale': '吸气',
            'hold': '屏息',
            'exhale': '呼气',
            'holdAfter': '屏息'
        };
        this.breathText.textContent = textMap[phase] || '';
    }

    // 开始倒计时
    startCountdown() {
        this.updateTimerDisplay();
        this.countdownTimer = setInterval(() => {
            if (!this.isPaused && this.isRunning) {
                this.remainingTime--;
                this.updateTimerDisplay();
                
                if (this.remainingTime <= 0) {
                    this.stopBreathing();
                }
            }
        }, 1000);
    }

    // 更新计时器显示
    updateTimerDisplay() {
        const minutes = Math.floor(this.remainingTime / 60);
        const seconds = this.remainingTime % 60;
        this.breathTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // 更新呼吸动画
    updateBreathAnimation() {
        const pattern = this.rhythmPatterns[this.rhythmMode];
        const totalDuration = pattern.inhale + pattern.hold + pattern.exhale + (pattern.holdAfter || 0);
        
        // 动态创建 CSS 动画
        const styleId = 'breath-animation-style';
        let styleEl = document.getElementById(styleId);
        
        if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = styleId;
            document.head.appendChild(styleEl);
        }

        const inhalePercent = (pattern.inhale / totalDuration) * 100;
        const holdPercent = ((pattern.inhale + pattern.hold) / totalDuration) * 100;
        const exhalePercent = ((pattern.inhale + pattern.hold + pattern.exhale) / totalDuration) * 100;

        styleEl.textContent = `
            @keyframes breathe {
                0% {
                    transform: scale(1);
                }
                ${inhalePercent}% {
                    transform: scale(1.8);
                }
                ${holdPercent}% {
                    transform: scale(1.8);
                }
                ${exhalePercent}% {
                    transform: scale(1);
                }
                100% {
                    transform: scale(1);
                }
            }
            .breath-circle.breathing {
                animation: breathe ${totalDuration}s ease-in-out infinite;
            }
        `;
    }

    // 保存设置
    saveSettings() {
        const settings = {
            rhythmMode: this.rhythmMode,
            customPattern: this.rhythmPatterns.custom,
            soundType: this.currentSound,
            volume: this.soundVolume,
            darkMode: document.body.classList.contains('dark-mode')
        };
        localStorage.setItem('breathAppSettings', JSON.stringify(settings));
    }

    // 加载设置
    loadSettings() {
        try {
            const saved = localStorage.getItem('breathAppSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.rhythmMode = settings.rhythmMode || '478';
                if (settings.customPattern) {
                    this.rhythmPatterns.custom = settings.customPattern;
                }
                this.currentSound = settings.soundType || 'none';
                this.soundVolume = settings.volume !== undefined ? settings.volume : 0.5;
                
                if (settings.darkMode) {
                    document.body.classList.add('dark-mode');
                }
            }
        } catch (e) {
            console.error('加载设置失败:', e);
        }
    }

    // 更新 UI
    updateUI() {
        // 更新呼吸模式按钮
        this.rhythmBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.rhythm === this.rhythmMode);
        });
        
        // 更新自定义设置
        if (this.rhythmMode === 'custom') {
            this.customSettings.classList.add('active');
            const pattern = this.rhythmPatterns.custom;
            this.customInhale.value = pattern.inhale;
            this.customHold.value = pattern.hold;
            this.customExhale.value = pattern.exhale;
        }

        // 更新音效按钮
        this.soundBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.sound === this.currentSound);
        });

        // 更新音量
        this.volumeSlider.value = Math.round(this.soundVolume * 100);
        this.volumeValue.textContent = `${Math.round(this.soundVolume * 100)}%`;

        // 更新夜间模式按钮
        if (document.body.classList.contains('dark-mode')) {
            this.darkModeBtn.classList.add('active');
        }

        // 更新呼吸模式信息
        this.updateRhythmInfo();
        this.updateBreathAnimation();
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    new BreathApp();
});

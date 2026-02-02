// 游戏配置
const CONFIG = {
    woolColors: ['#fff8f0', '#fffaf5', '#f5f0eb', '#fff5ee', '#faf5f0', '#fff'],
    woolRadius: { min: 12, max: 20 },
    woolDensity: 200,
    regrowSpeed: 50,
    cutRadius: { scissors: 25, razor: 40 }
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
    
    // 剪刀剪切音效
    playSnip() {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 创建噪音源模拟剪刀声
        const bufferSize = ctx.sampleRate * 0.08;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            // 快速衰减的噪音
            const decay = 1 - (i / bufferSize);
            data[i] = (Math.random() * 2 - 1) * decay * decay;
        }
        
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        
        // 高通滤波器让声音更清脆
        const highpass = ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.value = 2000;
        
        // 音量控制
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialDecayTo
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
        
        noise.connect(highpass);
        highpass.connect(gain);
        gain.connect(ctx.destination);
        
        noise.start(now);
        noise.stop(now + 0.08);
    }
    
    // 剃刀音效
    playRazor() {
        if (!this.enabled || !this.audioContext) return;
        
        const ctx = this.audioContext;
        const now = ctx.currentTime;
        
        // 创建嗡嗡声
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150 + Math.random() * 50, now);
        
        // 添加震动效果
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 30;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 20;
        lfo.connect(lfoGain);
        lfoGain.connect(osc.frequency);
        
        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        
        // 低通滤波
        const lowpass = ctx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 800;
        
        osc.connect(lowpass);
        lowpass.connect(gain);
        gain.connect(ctx.destination);
        
        lfo.start(now);
        osc.start(now);
        osc.stop(now + 0.1);
        lfo.stop(now + 0.1);
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

const soundManager = new SoundManager();

// 游戏状态
const state = {
    wool: [],
    woolCount: 0,
    currentTool: 'scissors',
    isDrawing: false,
    lastPos: null,
    canvasRect: null
};

// DOM 元素
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const woolCountEl = document.getElementById('woolCount');
const regrowBtn = document.getElementById('regrowBtn');
const fallingWoolContainer = document.getElementById('fallingWool');
const sheepFace = document.getElementById('sheepFace');
const mouth = document.getElementById('mouth');
const toolBtns = document.querySelectorAll('.tool-btn');
const soundToggleBtn = document.getElementById('soundToggle');

// 初始化画布
function initCanvas() {
    const container = canvas.parentElement;
    const size = Math.min(container.offsetWidth, container.offsetHeight);
    canvas.width = size * 2; // 高清显示
    canvas.height = size * 2;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(2, 2);
    state.canvasRect = canvas.getBoundingClientRect();
}

// 生成羊毛
function generateWool() {
    state.wool = [];
    const centerX = canvas.width / 4;
    const centerY = canvas.height / 4;
    const radius = Math.min(centerX, centerY) - 20;
    
    // 创建圆形羊毛区域，中心留空给脸
    for (let i = 0; i < CONFIG.woolDensity; i++) {
        const angle = Math.random() * Math.PI * 2;
        const minDist = 55; // 脸部半径
        const maxDist = radius;
        const dist = minDist + Math.random() * (maxDist - minDist);
        
        const x = centerX + Math.cos(angle) * dist;
        const y = centerY + Math.sin(angle) * dist;
        
        const woolPiece = {
            x,
            y,
            radius: CONFIG.woolRadius.min + Math.random() * (CONFIG.woolRadius.max - CONFIG.woolRadius.min),
            color: CONFIG.woolColors[Math.floor(Math.random() * CONFIG.woolColors.length)],
            offsetX: (Math.random() - 0.5) * 5,
            offsetY: (Math.random() - 0.5) * 5,
            wobble: Math.random() * Math.PI * 2,
            wobbleSpeed: 0.02 + Math.random() * 0.02
        };
        
        state.wool.push(woolPiece);
    }
}

// 绘制羊毛
function drawWool() {
    ctx.clearRect(0, 0, canvas.width / 2, canvas.height / 2);
    
    // 绘制羊身体底色
    const centerX = canvas.width / 4;
    const centerY = canvas.height / 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, Math.min(centerX, centerY) - 15, 0, Math.PI * 2);
    ctx.fillStyle = '#e8ddd4';
    ctx.fill();
    
    // 绘制每一块羊毛
    state.wool.forEach(wool => {
        wool.wobble += wool.wobbleSpeed;
        const wobbleX = Math.sin(wool.wobble) * 2;
        const wobbleY = Math.cos(wool.wobble) * 2;
        
        ctx.beginPath();
        ctx.arc(
            wool.x + wool.offsetX + wobbleX,
            wool.y + wool.offsetY + wobbleY,
            wool.radius,
            0,
            Math.PI * 2
        );
        
        // 添加渐变效果
        const gradient = ctx.createRadialGradient(
            wool.x + wool.offsetX + wobbleX - wool.radius * 0.3,
            wool.y + wool.offsetY + wobbleY - wool.radius * 0.3,
            0,
            wool.x + wool.offsetX + wobbleX,
            wool.y + wool.offsetY + wobbleY,
            wool.radius
        );
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, wool.color);
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 添加阴影效果
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
    });
    
    ctx.shadowColor = 'transparent';
}

// 剪羊毛
function cutWool(x, y) {
    const cutRadius = CONFIG.cutRadius[state.currentTool];
    let cutCount = 0;
    
    state.wool = state.wool.filter(wool => {
        const dist = Math.sqrt((wool.x - x) ** 2 + (wool.y - y) ** 2);
        if (dist < cutRadius + wool.radius) {
            // 创建掉落动画
            createFallingWool(wool);
            cutCount++;
            return false;
        }
        return true;
    });
    
    if (cutCount > 0) {
        state.woolCount += cutCount;
        woolCountEl.textContent = state.woolCount;
        
        // 播放剪切音效
        if (state.currentTool === 'scissors') {
            soundManager.playSnip();
        } else {
            soundManager.playRazor();
        }
        
        // 触觉反馈
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
        
        // 羊的反应
        sheepFace.classList.add('shaking');
        setTimeout(() => sheepFace.classList.remove('shaking'), 100);
        
        // 随机显示满足表情
        if (Math.random() > 0.7) {
            showSatisfaction(x, y);
        }
        
        // 更新羊的表情
        updateSheepMood();
    }
}

// 创建掉落的羊毛粒子
function createFallingWool(wool) {
    const rect = state.canvasRect;
    const scaleX = rect.width / (canvas.width / 2);
    const scaleY = rect.height / (canvas.height / 2);
    
    const particle = document.createElement('div');
    particle.className = 'wool-particle';
    particle.style.left = (rect.left + wool.x * scaleX) + 'px';
    particle.style.top = (rect.top + wool.y * scaleY) + 'px';
    particle.style.width = (wool.radius * 2 * scaleX) + 'px';
    particle.style.height = (wool.radius * 2 * scaleY) + 'px';
    particle.style.background = `radial-gradient(circle at 30% 30%, #fff, ${wool.color})`;
    particle.style.animationDuration = (1.5 + Math.random()) + 's';
    
    fallingWoolContainer.appendChild(particle);
    
    // 清理粒子
    setTimeout(() => {
        particle.remove();
    }, 2500);
}

// 显示满足感动画
function showSatisfaction(x, y) {
    const rect = state.canvasRect;
    const scaleX = rect.width / (canvas.width / 2);
    const scaleY = rect.height / (canvas.height / 2);
    
    const emojis = ['✨', '💫', '⭐', '🌟', '😊', '🎉'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    
    const burst = document.createElement('div');
    burst.className = 'satisfaction-burst';
    burst.textContent = emoji;
    burst.style.left = (rect.left + x * scaleX) + 'px';
    burst.style.top = (rect.top + y * scaleY) + 'px';
    
    document.body.appendChild(burst);
    
    setTimeout(() => burst.remove(), 800);
}

// 更新羊的心情
function updateSheepMood() {
    const woolPercentage = state.wool.length / CONFIG.woolDensity;
    
    if (woolPercentage < 0.3) {
        mouth.textContent = '◡‿◡';
        mouth.classList.add('happy');
    } else if (woolPercentage < 0.6) {
        mouth.textContent = 'ω';
        mouth.classList.remove('happy');
    } else {
        mouth.textContent = '︵';
        mouth.classList.remove('happy');
    }
}

// 重新长毛
function regrowWool() {
    if (state.wool.length >= CONFIG.woolDensity) return;
    
    const centerX = canvas.width / 4;
    const centerY = canvas.height / 4;
    const radius = Math.min(centerX, centerY) - 20;
    
    const regrowInterval = setInterval(() => {
        if (state.wool.length >= CONFIG.woolDensity) {
            clearInterval(regrowInterval);
            updateSheepMood();
            return;
        }
        
        // 每次添加几块羊毛
        for (let i = 0; i < 3 && state.wool.length < CONFIG.woolDensity; i++) {
            const angle = Math.random() * Math.PI * 2;
            const minDist = 55;
            const maxDist = radius;
            const dist = minDist + Math.random() * (maxDist - minDist);
            
            const x = centerX + Math.cos(angle) * dist;
            const y = centerY + Math.sin(angle) * dist;
            
            state.wool.push({
                x,
                y,
                radius: CONFIG.woolRadius.min + Math.random() * (CONFIG.woolRadius.max - CONFIG.woolRadius.min),
                color: CONFIG.woolColors[Math.floor(Math.random() * CONFIG.woolColors.length)],
                offsetX: (Math.random() - 0.5) * 5,
                offsetY: (Math.random() - 0.5) * 5,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 0.02 + Math.random() * 0.02
            });
        }
        
        updateSheepMood();
    }, CONFIG.regrowSpeed);
}

// 获取事件坐标
function getEventPos(e) {
    const rect = state.canvasRect;
    let clientX, clientY;
    
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }
    
    const scaleX = (canvas.width / 2) / rect.width;
    const scaleY = (canvas.height / 2) / rect.height;
    
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

// 事件处理
function handleStart(e) {
    e.preventDefault();
    state.isDrawing = true;
    state.canvasRect = canvas.getBoundingClientRect();
    const pos = getEventPos(e);
    state.lastPos = pos;
    cutWool(pos.x, pos.y);
}

function handleMove(e) {
    e.preventDefault();
    if (!state.isDrawing) return;
    
    const pos = getEventPos(e);
    
    // 插值处理，确保连续剪切
    if (state.lastPos) {
        const dx = pos.x - state.lastPos.x;
        const dy = pos.y - state.lastPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const steps = Math.max(1, Math.floor(dist / 10));
        
        for (let i = 1; i <= steps; i++) {
            const t = i / steps;
            const interpX = state.lastPos.x + dx * t;
            const interpY = state.lastPos.y + dy * t;
            cutWool(interpX, interpY);
        }
    }
    
    state.lastPos = pos;
}

function handleEnd(e) {
    e.preventDefault();
    state.isDrawing = false;
    state.lastPos = null;
}

// 工具切换
toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        toolBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentTool = btn.dataset.tool;
        
        // 更新光标
        if (state.currentTool === 'razor') {
            canvas.style.cursor = 'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><text y="20" font-size="20">🪒</text></svg>\') 16 16, crosshair';
        } else {
            canvas.style.cursor = 'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><text y="20" font-size="20">✂️</text></svg>\') 16 16, crosshair';
        }
    });
});

// 眼睛跟随
document.addEventListener('mousemove', (e) => {
    const pupils = document.querySelectorAll('.pupil');
    const rect = sheepFace.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const distance = Math.min(3, Math.sqrt((e.clientX - centerX) ** 2 + (e.clientY - centerY) ** 2) / 50);
    
    pupils.forEach(pupil => {
        pupil.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
    });
});

// 游戏循环
function gameLoop() {
    drawWool();
    requestAnimationFrame(gameLoop);
}

// 初始化
function init() {
    initCanvas();
    generateWool();
    gameLoop();
    
    // 绑定事件
    canvas.addEventListener('mousedown', handleStart);
    canvas.addEventListener('mousemove', handleMove);
    canvas.addEventListener('mouseup', handleEnd);
    canvas.addEventListener('mouseleave', handleEnd);
    
    canvas.addEventListener('touchstart', handleStart, { passive: false });
    canvas.addEventListener('touchmove', handleMove, { passive: false });
    canvas.addEventListener('touchend', handleEnd, { passive: false });
    canvas.addEventListener('touchcancel', handleEnd, { passive: false });
    
    regrowBtn.addEventListener('click', regrowWool);
    
    // 音效开关
    soundToggleBtn.addEventListener('click', () => {
        const enabled = soundManager.toggle();
        soundToggleBtn.textContent = enabled ? '🔊 音效' : '🔇 静音';
        soundToggleBtn.classList.toggle('muted', !enabled);
    });
    
    // 窗口大小变化
    window.addEventListener('resize', () => {
        initCanvas();
        state.canvasRect = canvas.getBoundingClientRect();
    });
}

// 启动游戏
init();

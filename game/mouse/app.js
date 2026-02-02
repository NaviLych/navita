// 游戏状态
const state = {
    score: 0,
    highScore: parseInt(localStorage.getItem('moleHighScore')) || 0,
    timeLeft: 30,
    isPlaying: false,
    difficulty: null,
    soundEnabled: true,
    lastHole: -1,
    moleTimer: null,
    gameTimer: null,
    customImage: null
};

// 难度设置
const difficulties = {
    easy: { minTime: 800, maxTime: 1500, showTime: 1200, name: '简单模式' },
    normal: { minTime: 500, maxTime: 1000, showTime: 900, name: '普通模式' },
    hard: { minTime: 300, maxTime: 700, showTime: 600, name: '困难模式' }
};

// DOM 元素
const scoreEl = document.getElementById('score');
const timerEl = document.getElementById('timer');
const highScoreEl = document.getElementById('highScore');
const overlay = document.getElementById('overlay');
const overlayIcon = document.getElementById('overlayIcon');
const overlayTitle = document.getElementById('overlayTitle');
const overlayMessage = document.getElementById('overlayMessage');
const finalScore = document.getElementById('finalScore');
const startBtn = document.getElementById('startBtn');
const soundToggle = document.getElementById('soundToggle');
const hammer = document.getElementById('hammer');
const scorePopup = document.getElementById('scorePopup');
const holes = document.querySelectorAll('.hole');
const moles = document.querySelectorAll('.mole');
const diffOptions = document.querySelectorAll('.diff-option');
const difficultySelect = document.getElementById('difficultySelect');
const customImageSection = document.getElementById('customImageSection');
const imageUpload = document.getElementById('imageUpload');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const removeImageBtn = document.getElementById('removeImage');
const uploadText = document.getElementById('uploadText');
const currentDiffDisplay = document.getElementById('currentDiffDisplay');

// 音频上下文
let audioContext;

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    if (!state.soundEnabled || !audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const sounds = {
        whack: { freq: 150, duration: 0.1, type: 'square' },
        miss: { freq: 80, duration: 0.15, type: 'sawtooth' },
        start: { freq: 500, duration: 0.2, type: 'sine' },
        end: { freq: 200, duration: 0.3, type: 'triangle' }
    };

    const sound = sounds[type] || sounds.whack;

    oscillator.frequency.setValueAtTime(sound.freq, audioContext.currentTime);
    oscillator.type = sound.type;

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + sound.duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + sound.duration);
}

// 随机选择洞穴（不重复上一个）
function randomHole() {
    const idx = Math.floor(Math.random() * holes.length);
    if (idx === state.lastHole) {
        return randomHole();
    }
    state.lastHole = idx;
    return idx;
}

// 随机时间
function randomTime(min, max) {
    return Math.random() * (max - min) + min;
}

// 显示地鼠
function showMole() {
    if (!state.isPlaying) return;

    const diff = difficulties[state.difficulty];
    const holeIdx = randomHole();
    const mole = moles[holeIdx];

    mole.classList.add('up');

    // 地鼠自动消失
    setTimeout(() => {
        if (mole.classList.contains('up') && !mole.classList.contains('whacked')) {
            mole.classList.remove('up');
        }
    }, diff.showTime);

    // 下一个地鼠
    const nextTime = randomTime(diff.minTime, diff.maxTime);
    state.moleTimer = setTimeout(showMole, nextTime);
}

// 打地鼠
function whackMole(mole, e) {
    if (!state.isPlaying) return;
    if (!mole.classList.contains('up')) return;
    if (mole.classList.contains('whacked')) return;

    mole.classList.add('whacked');
    playSound('whack');

    // 加分
    state.score += 10;
    scoreEl.textContent = state.score;

    // 显示得分动画
    showScorePopup(e.clientX || e.touches?.[0]?.clientX, e.clientY || e.touches?.[0]?.clientY);

    // 锤子动画
    hammer.classList.add('hit');
    setTimeout(() => hammer.classList.remove('hit'), 100);

    // 地鼠消失
    setTimeout(() => {
        mole.classList.remove('up', 'whacked');
    }, 200);
}

// 显示得分弹出
function showScorePopup(x, y) {
    scorePopup.style.left = x + 'px';
    scorePopup.style.top = y + 'px';
    scorePopup.classList.remove('show');
    void scorePopup.offsetWidth; // 强制重排
    scorePopup.classList.add('show');
}

// 开始游戏
function startGame() {
    if (!state.difficulty) return;
    
    initAudio();
    playSound('start');

    state.score = 0;
    state.timeLeft = 30;
    state.isPlaying = true;
    state.lastHole = -1;

    scoreEl.textContent = '0';
    timerEl.textContent = '30';
    overlay.classList.add('hidden');
    currentDiffDisplay.textContent = difficulties[state.difficulty].name;

    // 重置所有地鼠
    moles.forEach(mole => mole.classList.remove('up', 'whacked'));

    // 开始出现地鼠
    showMole();

    // 开始计时
    state.gameTimer = setInterval(() => {
        state.timeLeft--;
        timerEl.textContent = state.timeLeft;

        if (state.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

// 结束游戏
function endGame() {
    state.isPlaying = false;
    clearTimeout(state.moleTimer);
    clearInterval(state.gameTimer);

    playSound('end');

    // 隐藏所有地鼠
    moles.forEach(mole => mole.classList.remove('up', 'whacked'));

    // 更新最高分
    if (state.score > state.highScore) {
        state.highScore = state.score;
        localStorage.setItem('moleHighScore', state.highScore);
        highScoreEl.textContent = state.highScore;
    }

    // 显示结果
    overlayIcon.textContent = state.score >= 100 ? '🏆' : '🐹';
    overlayTitle.textContent = '游戏结束!';
    overlayMessage.textContent = state.score >= 100 ? '太棒了!' : '再接再厉!';
    finalScore.textContent = `得分: ${state.score}`;
    startBtn.textContent = '再来一局';
    startBtn.classList.remove('hidden');
    difficultySelect.style.display = 'none';
    customImageSection.style.display = 'none';
    overlay.classList.remove('hidden');
}

// 重置开始界面
function resetOverlay() {
    overlayIcon.textContent = '🐹';
    overlayTitle.textContent = '打地鼠';
    overlayMessage.textContent = '选择难度开始游戏';
    finalScore.textContent = '';
    startBtn.classList.add('hidden');
    startBtn.textContent = '开始游戏';
    difficultySelect.style.display = 'flex';
    customImageSection.style.display = 'block';
    state.difficulty = null;
    diffOptions.forEach(opt => opt.classList.remove('selected'));
}

// 选择难度
function selectDifficulty(diff) {
    state.difficulty = diff;
    diffOptions.forEach(opt => {
        opt.classList.toggle('selected', opt.dataset.diff === diff);
    });
    startBtn.classList.remove('hidden');
    playSound('whack');
}

// 更新地鼠图片
function updateMoleImages() {
    moles.forEach(mole => {
        const face = mole.querySelector('.mole-face');
        const existingImg = mole.querySelector('.mole-image');
        
        if (state.customImage) {
            if (face) face.style.display = 'none';
            if (existingImg) {
                existingImg.src = state.customImage;
            } else {
                const img = document.createElement('img');
                img.className = 'mole-image';
                img.src = state.customImage;
                mole.appendChild(img);
            }
        } else {
            if (face) face.style.display = '';
            if (existingImg) existingImg.remove();
        }
    });
}

// 处理图片上传
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        state.customImage = event.target.result;
        previewImage.src = state.customImage;
        previewContainer.classList.add('active');
        uploadText.textContent = '更换图片';
        overlayIcon.innerHTML = `<img src="${state.customImage}" style="width:60px;height:60px;border-radius:50%;object-fit:cover;">`;
        updateMoleImages();
    };
    reader.readAsDataURL(file);
}

// 移除自定义图片
function removeCustomImage() {
    state.customImage = null;
    previewContainer.classList.remove('active');
    previewImage.src = '';
    uploadText.textContent = '上传自定义头像';
    imageUpload.value = '';
    overlayIcon.textContent = '🐹';
    updateMoleImages();
}

// 锤子跟随鼠标/触摸
function updateHammer(e) {
    const x = e.clientX || e.touches?.[0]?.clientX;
    const y = e.clientY || e.touches?.[0]?.clientY;
    if (x && y) {
        hammer.style.left = x + 'px';
        hammer.style.top = y + 'px';
    }
}

// 事件绑定
startBtn.addEventListener('click', () => {
    if (startBtn.textContent === '再来一局') {
        resetOverlay();
    } else {
        startGame();
    }
});

soundToggle.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    soundToggle.textContent = state.soundEnabled ? '🔊' : '🔇';
    soundToggle.classList.toggle('muted', !state.soundEnabled);
});

// 难度选择
diffOptions.forEach(btn => {
    btn.addEventListener('click', () => {
        selectDifficulty(btn.dataset.diff);
    });
});

// 图片上传
imageUpload.addEventListener('change', handleImageUpload);
removeImageBtn.addEventListener('click', removeCustomImage);

// 地鼠点击
moles.forEach(mole => {
    mole.addEventListener('click', (e) => whackMole(mole, e));
    mole.addEventListener('touchstart', (e) => {
        e.preventDefault();
        whackMole(mole, e);
    });
});

// 点击空白处音效
document.addEventListener('click', (e) => {
    if (state.isPlaying && !e.target.closest('.mole.up')) {
        playSound('miss');
        hammer.classList.add('hit');
        setTimeout(() => hammer.classList.remove('hit'), 100);
    }
});

// 锤子跟随
document.addEventListener('mousemove', updateHammer);
document.addEventListener('touchmove', updateHammer);
document.addEventListener('touchstart', updateHammer);

// 初始化显示最高分
highScoreEl.textContent = state.highScore;

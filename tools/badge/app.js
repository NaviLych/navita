// State management
const state = {
    theme: localStorage.getItem('badge-theme') || 'dark',
    title: '我的电子吧唧',
    subtitle: '定制你的专属徽章',
    imageData: localStorage.getItem('badge-image') || null,
    style: localStorage.getItem('badge-style') || 'gradient',
    shape: localStorage.getItem('badge-shape') || 'rounded',
    effects: {
        shine: true,
        animate: true,
        glow: false
    }
};

// Load saved effects
try {
    const savedEffects = JSON.parse(localStorage.getItem('badge-effects'));
    if (savedEffects) {
        state.effects = savedEffects;
    }
} catch (e) {
    console.error('Failed to load effects:', e);
}

// DOM elements
const elements = {
    badge: document.getElementById('badge'),
    badgeImage: document.getElementById('badgeImage'),
    badgeImageWrapper: document.getElementById('badgeImageWrapper'),
    imagePlaceholder: document.getElementById('imagePlaceholder'),
    badgeTitle: document.getElementById('badgeTitle'),
    badgeSubtitle: document.getElementById('badgeSubtitle'),
    badgeDate: document.getElementById('badgeDate'),
    badgeShine: document.querySelector('.badge-shine'),
    imageInput: document.getElementById('imageInput'),
    imageUploadArea: document.getElementById('imageUploadArea'),
    titleInput: document.getElementById('titleInput'),
    subtitleInput: document.getElementById('subtitleInput'),
    clearImageBtn: document.getElementById('clearImageBtn'),
    themeToggle: document.getElementById('themeToggle'),
    downloadBtn: document.getElementById('downloadBtn'),
    resetBtn: document.getElementById('resetBtn'),
    shineEffect: document.getElementById('shineEffect'),
    animateEffect: document.getElementById('animateEffect'),
    glowEffect: document.getElementById('glowEffect')
};

// Initialize app
function init() {
    // Set theme
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();

    // Set date
    updateDate();

    // Load saved data
    if (state.imageData) {
        elements.badgeImage.src = state.imageData;
        elements.badgeImage.classList.remove('hidden');
        elements.imagePlaceholder.classList.add('hidden');
    }

    elements.titleInput.value = state.title;
    elements.subtitleInput.value = state.subtitle;
    elements.badgeTitle.textContent = state.title;
    elements.badgeSubtitle.textContent = state.subtitle;

    // Apply saved style and shape
    applyStyle(state.style);
    applyShape(state.shape);
    
    // Apply saved effects
    elements.shineEffect.checked = state.effects.shine;
    elements.animateEffect.checked = state.effects.animate;
    elements.glowEffect.checked = state.effects.glow;
    updateEffects();

    // Event listeners
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.imageInput.addEventListener('change', handleImageUpload);
    elements.titleInput.addEventListener('input', handleTitleChange);
    elements.subtitleInput.addEventListener('input', handleSubtitleChange);
    elements.clearImageBtn.addEventListener('click', clearImage);
    elements.downloadBtn.addEventListener('click', downloadBadge);
    elements.resetBtn.addEventListener('click', resetToDefaults);
    
    // Effect checkboxes
    elements.shineEffect.addEventListener('change', handleEffectChange);
    elements.animateEffect.addEventListener('change', handleEffectChange);
    elements.glowEffect.addEventListener('change', handleEffectChange);

    // Drag and drop
    elements.imageUploadArea.addEventListener('dragover', handleDragOver);
    elements.imageUploadArea.addEventListener('dragleave', handleDragLeave);
    elements.imageUploadArea.addEventListener('drop', handleDrop);

    // Style buttons
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const style = btn.dataset.style;
            document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyStyle(style);
            state.style = style;
            localStorage.setItem('badge-style', style);
        });
    });

    // Shape buttons
    document.querySelectorAll('.shape-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const shape = btn.dataset.shape;
            document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyShape(shape);
            state.shape = shape;
            localStorage.setItem('badge-shape', shape);
        });
    });
}

// Theme management
function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('badge-theme', state.theme);
    updateThemeIcon();
}

function updateThemeIcon() {
    elements.themeToggle.textContent = state.theme === 'light' ? '🌙' : '☀️';
}

// Date management
function updateDate() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    elements.badgeDate.textContent = `${year}.${month}.${day}`;
}

// Image handling
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target.result;
            state.imageData = imageData;
            localStorage.setItem('badge-image', imageData);
            
            elements.badgeImage.src = imageData;
            elements.badgeImage.classList.remove('hidden');
            elements.imagePlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(file);
    }
}

function clearImage() {
    state.imageData = null;
    localStorage.removeItem('badge-image');
    elements.badgeImage.src = '';
    elements.badgeImage.classList.add('hidden');
    elements.imagePlaceholder.classList.remove('hidden');
    elements.imageInput.value = '';
}

// Drag and drop
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.imageUploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.imageUploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.imageUploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const imageData = event.target.result;
            state.imageData = imageData;
            localStorage.setItem('badge-image', imageData);
            
            elements.badgeImage.src = imageData;
            elements.badgeImage.classList.remove('hidden');
            elements.imagePlaceholder.classList.add('hidden');
        };
        reader.readAsDataURL(files[0]);
    }
}

// Text handling
function handleTitleChange(e) {
    state.title = e.target.value || '我的电子吧唧';
    elements.badgeTitle.textContent = state.title;
}

function handleSubtitleChange(e) {
    state.subtitle = e.target.value || '定制你的专属徽章';
    elements.badgeSubtitle.textContent = state.subtitle;
}

// Style management
function applyStyle(style) {
    elements.badge.classList.remove('style-gradient', 'style-solid', 'style-glass', 'style-neon');
    if (style !== 'gradient') {
        elements.badge.classList.add(`style-${style}`);
    }
}

function applyShape(shape) {
    elements.badge.classList.remove('shape-rounded', 'shape-circle', 'shape-square');
    if (shape !== 'rounded') {
        elements.badge.classList.add(`shape-${shape}`);
    }
}

// Effects management
function handleEffectChange() {
    state.effects.shine = elements.shineEffect.checked;
    state.effects.animate = elements.animateEffect.checked;
    state.effects.glow = elements.glowEffect.checked;
    
    localStorage.setItem('badge-effects', JSON.stringify(state.effects));
    updateEffects();
}

function updateEffects() {
    // Shine effect
    if (state.effects.shine) {
        elements.badgeShine.classList.add('active');
    } else {
        elements.badgeShine.classList.remove('active');
    }
    
    // Animate effect
    if (state.effects.animate) {
        elements.badge.classList.add('animate');
    } else {
        elements.badge.classList.remove('animate');
    }
    
    // Glow effect
    if (state.effects.glow) {
        elements.badge.classList.add('glow');
    } else {
        elements.badge.classList.remove('glow');
    }
}

// Download badge
function downloadBadge() {
    // Create a canvas to render the badge
    const badge = elements.badge;
    const canvas = document.createElement('canvas');
    const scale = 3; // Higher resolution
    const rect = badge.getBoundingClientRect();
    
    canvas.width = rect.width * scale;
    canvas.height = rect.height * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);
    
    // Use html2canvas-like approach manually
    // For now, we'll use a simple approach - download the current view
    // In a production app, you'd use html2canvas library
    
    // Alternative: Create a blob URL and download
    try {
        // Create a temporary container
        const container = document.createElement('div');
        container.style.cssText = `
            position: absolute;
            left: -9999px;
            width: ${rect.width}px;
            height: ${rect.height}px;
        `;
        
        const badgeClone = badge.cloneNode(true);
        container.appendChild(badgeClone);
        document.body.appendChild(container);
        
        // For now, show alert that download would happen
        // In production, use html2canvas or similar library
        alert('下载功能需要额外的库支持。\n\n您可以:\n1. 右键点击吧唧 → 另存为图片\n2. 使用截图工具保存');
        
        document.body.removeChild(container);
    } catch (error) {
        console.error('Download error:', error);
        alert('下载失败，请使用截图工具保存吧唧');
    }
}

// Reset to defaults
function resetToDefaults() {
    if (confirm('确定要重置为默认设置吗？')) {
        // Clear all saved data
        localStorage.removeItem('badge-image');
        localStorage.removeItem('badge-style');
        localStorage.removeItem('badge-shape');
        localStorage.removeItem('badge-effects');
        
        // Reset state
        state.title = '我的电子吧唧';
        state.subtitle = '定制你的专属徽章';
        state.imageData = null;
        state.style = 'gradient';
        state.shape = 'rounded';
        state.effects = {
            shine: true,
            animate: true,
            glow: false
        };
        
        // Reset UI
        elements.titleInput.value = state.title;
        elements.subtitleInput.value = state.subtitle;
        elements.badgeTitle.textContent = state.title;
        elements.badgeSubtitle.textContent = state.subtitle;
        
        clearImage();
        
        // Reset style buttons
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.style === 'gradient');
        });
        applyStyle('gradient');
        
        // Reset shape buttons
        document.querySelectorAll('.shape-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.shape === 'rounded');
        });
        applyShape('rounded');
        
        // Reset effects
        elements.shineEffect.checked = true;
        elements.animateEffect.checked = true;
        elements.glowEffect.checked = false;
        updateEffects();
        
        updateDate();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

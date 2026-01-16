// Constants
const DOWNLOAD_MESSAGE = '下载功能提示:\n\n' +
                        '1. 右键点击吧唧 → 另存为图片\n' +
                        '2. 使用截图工具保存\n' +
                        '3. 保存到吧唧墙后随时查看\n\n' +
                        '提示: 完整的下载功能需要html2canvas库支持';

// State management
const state = {
    theme: 'dark',
    title: '我的电子吧唧',
    subtitle: '定制你的专属徽章',
    imageData: null, // Stores cropped image data
    style: 'gradient',
    shape: 'rounded',
    effects: {
        shine: true,
        animate: true,
        glow: false
    },
    currentTab: 'editor',
    editingBadgeId: null
};

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
    saveBadgeBtn: document.getElementById('saveBadgeBtn'),
    resetBtn: document.getElementById('resetBtn'),
    shineEffect: document.getElementById('shineEffect'),
    animateEffect: document.getElementById('animateEffect'),
    glowEffect: document.getElementById('glowEffect'),
    galleryGrid: document.getElementById('galleryGrid'),
    galleryEmpty: document.getElementById('galleryEmpty'),
    clearAllBadgesBtn: document.getElementById('clearAllBadgesBtn')
};

// Initialize app
async function init() {
    try {
        // Initialize database
        await badgeDB.init();
        
        // Load settings
        await loadSettings();
        
        // Set theme
        document.documentElement.setAttribute('data-theme', state.theme);
        updateThemeIcon();

        // Set date
        updateDate();

        // Apply saved settings
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
        setupEventListeners();
        
        // Load gallery
        await loadGallery();
        
        console.log('Badge generator initialized successfully');
    } catch (error) {
        console.error('Failed to initialize:', error);
        alert('初始化失败，可能是浏览器不支持IndexedDB');
    }
}

function setupEventListeners() {
    // Theme toggle
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // Image handling
    elements.imageInput.addEventListener('change', handleImageUpload);
    elements.clearImageBtn.addEventListener('click', clearImage);
    
    // Text inputs
    elements.titleInput.addEventListener('input', handleTitleChange);
    elements.subtitleInput.addEventListener('input', handleSubtitleChange);
    
    // Buttons
    elements.downloadBtn.addEventListener('click', downloadBadge);
    elements.saveBadgeBtn.addEventListener('click', saveBadge);
    elements.resetBtn.addEventListener('click', resetToDefaults);
    elements.clearAllBadgesBtn.addEventListener('click', clearAllBadges);
    
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
            saveSettings();
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
            saveSettings();
        });
    });
    
    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            switchTab(tab);
        });
    });
}

// Settings management
async function loadSettings() {
    try {
        state.theme = await badgeDB.getSetting('theme') || 'dark';
        state.style = await badgeDB.getSetting('style') || 'gradient';
        state.shape = await badgeDB.getSetting('shape') || 'rounded';
        state.effects = await badgeDB.getSetting('effects') || {
            shine: true,
            animate: true,
            glow: false
        };
    } catch (error) {
        console.error('Failed to load settings:', error);
    }
}

async function saveSettings() {
    try {
        await badgeDB.saveSetting('theme', state.theme);
        await badgeDB.saveSetting('style', state.style);
        await badgeDB.saveSetting('shape', state.shape);
        await badgeDB.saveSetting('effects', state.effects);
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
}

// Theme management
function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    saveSettings();
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

// Image handling with cropping
async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const originalImageData = event.target.result;
                
                // Open cropper
                const croppedData = await imageCropper.open(originalImageData);
                
                if (croppedData) {
                    // Only store the cropped image
                    state.imageData = croppedData;
                    
                    elements.badgeImage.src = croppedData;
                    elements.badgeImage.classList.remove('hidden');
                    elements.imagePlaceholder.classList.add('hidden');
                }
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Image upload error:', error);
            alert('图片上传失败，请重试');
        }
    }
}

function clearImage() {
    state.imageData = null;
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

async function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    elements.imageUploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const originalImageData = event.target.result;
                
                // Open cropper
                const croppedData = await imageCropper.open(originalImageData);
                
                if (croppedData) {
                    // Only store the cropped image
                    state.imageData = croppedData;
                    
                    elements.badgeImage.src = croppedData;
                    elements.badgeImage.classList.remove('hidden');
                    elements.imagePlaceholder.classList.add('hidden');
                }
            };
            reader.readAsDataURL(files[0]);
        } catch (error) {
            console.error('Drop error:', error);
            alert('图片上传失败，请重试');
        }
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
    
    // Update button state
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.style === style);
    });
}

function applyShape(shape) {
    elements.badge.classList.remove('shape-rounded', 'shape-circle', 'shape-square');
    if (shape !== 'rounded') {
        elements.badge.classList.add(`shape-${shape}`);
    }
    
    // Update button state
    document.querySelectorAll('.shape-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.shape === shape);
    });
}

// Effects management
function handleEffectChange() {
    state.effects.shine = elements.shineEffect.checked;
    state.effects.animate = elements.animateEffect.checked;
    state.effects.glow = elements.glowEffect.checked;
    
    saveSettings();
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

// Save badge to gallery
async function saveBadge() {
    try {
        const badgeData = {
            title: state.title,
            subtitle: state.subtitle,
            imageData: state.imageData, // Already contains cropped image
            style: state.style,
            shape: state.shape,
            effects: { ...state.effects },
            date: elements.badgeDate.textContent
        };
        
        if (state.editingBadgeId) {
            await badgeDB.updateBadge(state.editingBadgeId, badgeData);
            state.editingBadgeId = null;
            alert('吧唧已更新！');
        } else {
            await badgeDB.saveBadge(badgeData);
            alert('吧唧已保存到吧唧墙！');
        }
        
        await loadGallery();
    } catch (error) {
        console.error('Failed to save badge:', error);
        alert('保存失败，请重试');
    }
}

// Load badge from gallery
async function loadBadge(id) {
    try {
        const badge = await badgeDB.getBadge(id);
        if (badge) {
            state.title = badge.title;
            state.subtitle = badge.subtitle;
            // Backward compatibility: prefer croppedImageData if it exists (old schema)
            state.imageData = badge.croppedImageData || badge.imageData;
            state.style = badge.style;
            state.shape = badge.shape;
            state.effects = badge.effects;
            state.editingBadgeId = id;
            
            // Update UI
            elements.titleInput.value = state.title;
            elements.subtitleInput.value = state.subtitle;
            elements.badgeTitle.textContent = state.title;
            elements.badgeSubtitle.textContent = state.subtitle;
            
            if (state.imageData) {
                elements.badgeImage.src = state.imageData;
                elements.badgeImage.classList.remove('hidden');
                elements.imagePlaceholder.classList.add('hidden');
            } else {
                clearImage();
            }
            
            applyStyle(state.style);
            applyShape(state.shape);
            
            elements.shineEffect.checked = state.effects.shine;
            elements.animateEffect.checked = state.effects.animate;
            elements.glowEffect.checked = state.effects.glow;
            updateEffects();
            
            // Switch to editor tab
            switchTab('editor');
        }
    } catch (error) {
        console.error('Failed to load badge:', error);
        alert('加载失败，请重试');
    }
}

// Delete badge from gallery
async function deleteBadge(id) {
    if (confirm('确定要删除这个吧唧吗？')) {
        try {
            await badgeDB.deleteBadge(id);
            await loadGallery();
        } catch (error) {
            console.error('Failed to delete badge:', error);
            alert('删除失败，请重试');
        }
    }
}

// Clear all badges
async function clearAllBadges() {
    if (confirm('确定要清空所有吧唧吗？此操作无法撤销！')) {
        try {
            await badgeDB.clearAllBadges();
            await loadGallery();
        } catch (error) {
            console.error('Failed to clear badges:', error);
            alert('清空失败，请重试');
        }
    }
}

// Load gallery
async function loadGallery() {
    try {
        const badges = await badgeDB.getAllBadges();
        
        if (badges.length === 0) {
            elements.galleryEmpty.classList.remove('hidden');
            elements.galleryGrid.innerHTML = '';
            return;
        }
        
        elements.galleryEmpty.classList.add('hidden');
        
        // Sort by timestamp descending
        badges.sort((a, b) => b.timestamp - a.timestamp);
        
        elements.galleryGrid.innerHTML = badges.map(badge => {
            const date = new Date(badge.timestamp);
            const dateStr = `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
            
            return `
                <div class="gallery-item" data-id="${badge.id}">
                    <div class="gallery-item-actions">
                        <button class="gallery-item-btn load" data-badge-id="${badge.id}" title="加载">
                            ✏️
                        </button>
                        <button class="gallery-item-btn delete" data-badge-id="${badge.id}" title="删除">
                            🗑️
                        </button>
                    </div>
                    <div class="gallery-item-badge">
                        ${renderBadgePreview(badge)}
                    </div>
                    <div class="gallery-item-info">
                        <div class="gallery-item-title">${badge.title}</div>
                        <div class="gallery-item-date">${dateStr}</div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Add event listeners for gallery items
        elements.galleryGrid.querySelectorAll('.gallery-item-btn.load').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const badgeId = parseInt(btn.dataset.badgeId, 10);
                if (!isNaN(badgeId)) {
                    loadBadge(badgeId);
                }
            });
        });
        
        elements.galleryGrid.querySelectorAll('.gallery-item-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const badgeId = parseInt(btn.dataset.badgeId, 10);
                if (!isNaN(badgeId)) {
                    deleteBadge(badgeId);
                }
            });
        });
    } catch (error) {
        console.error('Failed to load gallery:', error);
    }
}

// Render badge preview for gallery
function renderBadgePreview(badge) {
    const styleClass = badge.style !== 'gradient' ? `style-${badge.style}` : '';
    const shapeClass = badge.shape !== 'rounded' ? `shape-${badge.shape}` : '';
    const glowClass = badge.effects.glow ? 'glow' : '';
    
    // Backward compatibility: prefer croppedImageData if it exists (old schema)
    const imageData = badge.croppedImageData || badge.imageData;
    const imgHtml = imageData 
        ? `<img src="${imageData}" alt="" class="badge-image">`
        : `<div class="image-placeholder">
             <div class="placeholder-icon">🖼️</div>
           </div>`;
    
    return `
        <div class="badge ${styleClass} ${shapeClass} ${glowClass}">
            <div class="badge-image-wrapper">
                ${imgHtml}
            </div>
            <div class="badge-text-container">
                <div class="badge-title">${badge.title}</div>
                <div class="badge-subtitle">${badge.subtitle}</div>
            </div>
            <div class="badge-footer">
                <div class="badge-date">${badge.date}</div>
            </div>
        </div>
    `;
}

// Tab switching
function switchTab(tab) {
    state.currentTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    
    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    if (tab === 'editor') {
        document.getElementById('editorTab').classList.add('active');
    } else if (tab === 'gallery') {
        document.getElementById('galleryTab').classList.add('active');
        loadGallery();
    }
}

// Download badge
// TODO: Implement proper image download using html2canvas library
// See: https://html2canvas.hertzen.com/
async function downloadBadge() {
    try {
        // Use modern browser API to convert badge to image
        const badge = elements.badge;
        
        // For a simple implementation, we'll use the canvas approach
        // In production, consider using html2canvas library for better results
        
        // Create a temporary canvas
        const canvas = document.createElement('canvas');
        const rect = badge.getBoundingClientRect();
        const scale = 2; // Higher resolution
        
        canvas.width = rect.width * scale;
        canvas.height = rect.height * scale;
        
        alert(DOWNLOAD_MESSAGE);
    } catch (error) {
        console.error('Download error:', error);
        alert('操作失败，请使用右键菜单或截图工具保存');
    }
}

// Reset to defaults
function resetToDefaults() {
    if (confirm('确定要重置为默认设置吗？')) {
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
        state.editingBadgeId = null;
        
        // Reset UI
        elements.titleInput.value = state.title;
        elements.subtitleInput.value = state.subtitle;
        elements.badgeTitle.textContent = state.title;
        elements.badgeSubtitle.textContent = state.subtitle;
        
        clearImage();
        
        applyStyle('gradient');
        applyShape('rounded');
        
        elements.shineEffect.checked = true;
        elements.animateEffect.checked = true;
        elements.glowEffect.checked = false;
        updateEffects();
        
        updateDate();
        saveSettings();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

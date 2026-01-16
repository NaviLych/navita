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

// Download badge as Apple Live Photo format
async function downloadBadge() {
    const badge = elements.badge;
    
    try {
        // Show loading state
        elements.downloadBtn.disabled = true;
        elements.downloadBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">生成中...</span>';
        
        // Step 1: Capture static image (JPEG for Live Photo compatibility)
        const staticImage = await captureStaticImage(badge);
        
        // Step 2: Capture animated video (MOV/MP4 for Live Photo)
        const videoBlob = await captureAnimatedVideo(badge);
        
        // Step 3: Download both files
        await downloadFiles(staticImage, videoBlob);
        
        // Reset button state
        elements.downloadBtn.disabled = false;
        elements.downloadBtn.innerHTML = '<span class="btn-icon">💾</span><span class="btn-text">下载吧唧</span>';
        
        // Show success message
        alert('✅ Live Photo 已生成！\n\n已下载两个文件:\n1. badge-photo.jpg (静态图片)\n2. badge-video.mov (动画视频)\n\n将这两个文件传输到您的 iPhone，可以作为 Live Photo 使用。');
        
    } catch (error) {
        console.error('Download error:', error);
        elements.downloadBtn.disabled = false;
        elements.downloadBtn.innerHTML = '<span class="btn-icon">💾</span><span class="btn-text">下载吧唧</span>';
        alert('下载失败: ' + error.message + '\n\n请确保浏览器支持此功能。');
    }
}

// Capture static image using html2canvas
async function captureStaticImage(badge) {
    return new Promise((resolve, reject) => {
        // Temporarily disable animations for static capture
        const wasAnimating = state.effects.animate;
        if (wasAnimating) {
            badge.classList.remove('animate');
        }
        
        html2canvas(badge, {
            backgroundColor: null,
            scale: 3, // High resolution
            logging: false,
            useCORS: true,
            allowTaint: true
        }).then(canvas => {
            // Restore animation state
            if (wasAnimating) {
                badge.classList.add('animate');
            }
            
            // Convert to JPEG blob (Apple Live Photos use JPEG)
            canvas.toBlob(blob => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('无法生成图片'));
                }
            }, 'image/jpeg', 0.95);
        }).catch(error => {
            // Restore animation state
            if (wasAnimating) {
                badge.classList.add('animate');
            }
            reject(error);
        });
    });
}

// Capture animated video using canvas recording
async function captureAnimatedVideo(badge) {
    return new Promise(async (resolve, reject) => {
        try {
            // Ensure animations are enabled
            const wasAnimating = state.effects.animate;
            if (!wasAnimating) {
                badge.classList.add('animate');
            }
            
            // Create an offscreen canvas to render frames
            const rect = badge.getBoundingClientRect();
            const scale = 2; // Balance quality and file size
            const canvas = document.createElement('canvas');
            canvas.width = rect.width * scale;
            canvas.height = rect.height * scale;
            
            // Capture stream from canvas
            const stream = canvas.captureStream(30); // 30 fps
            
            // Determine best video format
            let mimeType = 'video/webm;codecs=vp9';
            if (MediaRecorder.isTypeSupported('video/mp4')) {
                mimeType = 'video/mp4';
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                mimeType = 'video/webm;codecs=vp9';
            } else if (MediaRecorder.isTypeSupported('video/webm')) {
                mimeType = 'video/webm';
            } else {
                throw new Error('浏览器不支持视频录制');
            }
            
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType,
                videoBitsPerSecond: 2500000 // 2.5 Mbps
            });
            
            const chunks = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                // Restore animation state
                if (!wasAnimating) {
                    badge.classList.remove('animate');
                }
                
                const blob = new Blob(chunks, { type: mimeType });
                resolve(blob);
            };
            
            mediaRecorder.onerror = (e) => {
                // Restore animation state
                if (!wasAnimating) {
                    badge.classList.remove('animate');
                }
                reject(new Error('视频录制失败'));
            };
            
            // Start recording
            mediaRecorder.start();
            
            // Record for 3 seconds (typical Live Photo duration)
            const duration = 3000;
            const fps = 30;
            const frameInterval = 1000 / fps;
            let frameCount = 0;
            const totalFrames = duration / frameInterval;
            
            // Render frames to canvas
            const renderFrame = async () => {
                if (frameCount >= totalFrames) {
                    // Stop recording after duration
                    setTimeout(() => {
                        mediaRecorder.stop();
                    }, 100);
                    return;
                }
                
                try {
                    // Capture current frame using html2canvas
                    const frameCanvas = await html2canvas(badge, {
                        backgroundColor: null,
                        scale: scale,
                        logging: false,
                        useCORS: true,
                        allowTaint: true,
                        width: rect.width,
                        height: rect.height
                    });
                    
                    // Draw to our canvas
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(frameCanvas, 0, 0);
                    
                    frameCount++;
                    
                    // Schedule next frame
                    if (frameCount < totalFrames) {
                        setTimeout(renderFrame, frameInterval);
                    } else {
                        setTimeout(() => mediaRecorder.stop(), 100);
                    }
                } catch (error) {
                    console.error('Frame render error:', error);
                    mediaRecorder.stop();
                }
            };
            
            // Start rendering
            renderFrame();
            
        } catch (error) {
            reject(error);
        }
    });
}

// Download both files
async function downloadFiles(imageBlob, videoBlob) {
    // Generate timestamp for unique filenames
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    // Download static image (JPEG)
    const imageUrl = URL.createObjectURL(imageBlob);
    const imageLink = document.createElement('a');
    imageLink.href = imageUrl;
    imageLink.download = `badge-photo-${timestamp}.jpg`;
    document.body.appendChild(imageLink);
    imageLink.click();
    document.body.removeChild(imageLink);
    URL.revokeObjectURL(imageUrl);
    
    // Wait a bit before downloading video to avoid browser blocking
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Download video (MOV/WebM)
    const videoUrl = URL.createObjectURL(videoBlob);
    const videoLink = document.createElement('a');
    videoLink.href = videoUrl;
    // Use .mov extension for better iOS compatibility, even if it's webm
    videoLink.download = `badge-video-${timestamp}.mov`;
    document.body.appendChild(videoLink);
    videoLink.click();
    document.body.removeChild(videoLink);
    URL.revokeObjectURL(videoUrl);
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

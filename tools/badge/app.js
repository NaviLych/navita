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

// Download configuration constants
const DOWNLOAD_CONFIG = {
    IMAGE_SCALE: 3, // High resolution multiplier for static images
    VIDEO_SCALE: 2, // Balance between quality and file size for video
    VIDEO_DURATION: 3000, // Duration in milliseconds (3 seconds for Live Photo compatibility)
    VIDEO_FPS: 30, // Frames per second
    VIDEO_BITRATE: 2500000, // 2.5 Mbps
    IMAGE_QUALITY: 0.95 // JPEG quality (0-1)
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
        const filenames = await downloadFiles(staticImage, videoBlob);
        
        // Reset button state
        elements.downloadBtn.disabled = false;
        elements.downloadBtn.innerHTML = '<span class="btn-icon">💾</span><span class="btn-text">下载吧唧</span>';
        
        // Show success message
        alert(`✅ Live Photo 已生成！\n\n已下载两个文件:\n1. ${filenames.image}\n2. ${filenames.video}\n\n将这两个文件传输到您的 iPhone，可以作为 Live Photo 使用。`);
        
    } catch (error) {
        console.error('Download error:', error);
        elements.downloadBtn.disabled = false;
        elements.downloadBtn.innerHTML = '<span class="btn-icon">💾</span><span class="btn-text">下载吧唧</span>';
        alert('下载失败: ' + error.message + '\n\n请尝试使用现代浏览器（Chrome、Firefox、Safari）。');
    }
}

// Capture static image using SVG foreignObject
async function captureStaticImage(badge) {
    return new Promise((resolve, reject) => {
        try {
            // Temporarily disable animations for static capture
            const wasAnimating = state.effects.animate;
            if (wasAnimating) {
                badge.classList.remove('animate');
            }
            
            const rect = badge.getBoundingClientRect();
            const scale = DOWNLOAD_CONFIG.IMAGE_SCALE;
            
            // Create canvas
            const canvas = document.createElement('canvas');
            canvas.width = rect.width * scale;
            canvas.height = rect.height * scale;
            const ctx = canvas.getContext('2d', { willReadFrequently: false });
            
            // Apply scale transform
            ctx.save();
            ctx.scale(scale, scale);
            
            // Create SVG with inline styles to avoid CORS
            const svgData = createInlineSVGSnapshot(badge, rect.width, rect.height);
            const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
            
            // Create an object URL
            const url = URL.createObjectURL(svgBlob);
            
            const img = new Image();
            img.crossOrigin = 'anonymous'; // Try to avoid CORS
            
            img.onload = () => {
                try {
                    ctx.drawImage(img, 0, 0);
                    ctx.restore();
                    URL.revokeObjectURL(url);
                    
                    // Restore animation state
                    if (wasAnimating) {
                        badge.classList.add('animate');
                    }
                    
                    // Convert to JPEG blob
                    canvas.toBlob(blob => {
                        if (blob) {
                            resolve(blob);
                        } else {
                            reject(new Error('无法生成图片'));
                        }
                    }, 'image/jpeg', DOWNLOAD_CONFIG.IMAGE_QUALITY);
                } catch (error) {
                    ctx.restore();
                    URL.revokeObjectURL(url);
                    if (wasAnimating) {
                        badge.classList.add('animate');
                    }
                    reject(error);
                }
            };
            
            img.onerror = () => {
                ctx.restore();
                URL.revokeObjectURL(url);
                if (wasAnimating) {
                    badge.classList.add('animate');
                }
                reject(new Error('图片加载失败'));
            };
            
            img.src = url;
        } catch (error) {
            reject(error);
        }
    });
}

// Helper function to create inline SVG snapshot with embedded styles
function createInlineSVGSnapshot(element, width, height) {
    const clone = element.cloneNode(true);
    
    // Extract computed styles and apply inline
    applyComputedStyles(clone, element);
    
    // Get all CSS rules
    let cssText = '';
    try {
        const styleSheets = Array.from(document.styleSheets);
        styleSheets.forEach(sheet => {
            try {
                if (sheet.cssRules) {
                    Array.from(sheet.cssRules).forEach(rule => {
                        cssText += rule.cssText + '\n';
                    });
                }
            } catch (e) {
                // Skip inaccessible stylesheets
            }
        });
    } catch (e) {
        console.warn('Could not access stylesheets');
    }
    
    // Create SVG
    const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
            <foreignObject width="${width}" height="${height}" x="0" y="0">
                <div xmlns="http://www.w3.org/1999/xhtml">
                    <style>${cssText}</style>
                    ${clone.outerHTML}
                </div>
            </foreignObject>
        </svg>
    `;
    
    return svg;
}

// Helper to apply computed styles inline to avoid external dependencies
function applyComputedStyles(clone, original) {
    const computedStyle = window.getComputedStyle(original);
    const styleText = Array.from(computedStyle).map(key => 
        `${key}:${computedStyle.getPropertyValue(key)}`
    ).join(';');
    clone.setAttribute('style', styleText);
    
    // Recursively apply to children
    const cloneChildren = clone.children;
    const originalChildren = original.children;
    for (let i = 0; i < cloneChildren.length; i++) {
        if (originalChildren[i]) {
            applyComputedStyles(cloneChildren[i], originalChildren[i]);
        }
    }
}

// Capture animated video using canvas recording
function captureAnimatedVideo(badge) {
    return new Promise((resolve, reject) => {
        try {
            // Ensure animations are enabled
            const wasAnimating = state.effects.animate;
            if (!wasAnimating) {
                badge.classList.add('animate');
            }
            
            const rect = badge.getBoundingClientRect();
            const scale = DOWNLOAD_CONFIG.VIDEO_SCALE;
            const canvas = document.createElement('canvas');
            canvas.width = rect.width * scale;
            canvas.height = rect.height * scale;
            
            // Check for MediaRecorder support
            if (!canvas.captureStream) {
                throw new Error('您的浏览器不支持视频录制功能');
            }
            
            const stream = canvas.captureStream(DOWNLOAD_CONFIG.VIDEO_FPS);
            
            // Determine best video format
            let mimeType = 'video/webm;codecs=vp9';
            if (MediaRecorder.isTypeSupported('video/mp4')) {
                mimeType = 'video/mp4';
            } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
                mimeType = 'video/webm;codecs=vp9';
            } else if (MediaRecorder.isTypeSupported('video/webm')) {
                mimeType = 'video/webm';
            } else {
                throw new Error('浏览器不支持所需的视频格式');
            }
            
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: mimeType,
                videoBitsPerSecond: DOWNLOAD_CONFIG.VIDEO_BITRATE
            });
            
            const chunks = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                if (!wasAnimating) {
                    badge.classList.remove('animate');
                }
                const blob = new Blob(chunks, { type: mimeType });
                resolve(blob);
            };
            
            mediaRecorder.onerror = () => {
                if (!wasAnimating) {
                    badge.classList.remove('animate');
                }
                reject(new Error('视频录制失败'));
            };
            
            // Start recording
            mediaRecorder.start();
            
            // Record for configured duration
            const duration = DOWNLOAD_CONFIG.VIDEO_DURATION;
            const fps = DOWNLOAD_CONFIG.VIDEO_FPS;
            const frameInterval = 1000 / fps;
            const totalFrames = Math.floor(duration / frameInterval);
            let frameCount = 0;
            
            // Render frames
            const ctx = canvas.getContext('2d');
            
            // Helper function to handle frame completion
            const completeFrame = () => {
                frameCount++;
                if (frameCount < totalFrames) {
                    setTimeout(renderFrame, frameInterval);
                } else {
                    setTimeout(() => mediaRecorder.stop(), 100);
                }
            };
            
            const renderFrame = () => {
                if (frameCount >= totalFrames) {
                    setTimeout(() => mediaRecorder.stop(), 100);
                    return;
                }
                
                try {
                    // Capture frame using SVG method
                    const svgData = createInlineSVGSnapshot(badge, rect.width, rect.height);
                    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
                    const svgUrl = URL.createObjectURL(svgBlob);
                    
                    const img = new Image();
                    img.onload = () => {
                        ctx.save(); // Save current state
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.scale(scale, scale);
                        ctx.drawImage(img, 0, 0);
                        ctx.restore(); // Restore state
                        URL.revokeObjectURL(svgUrl);
                        completeFrame();
                    };
                    
                    img.onerror = () => {
                        URL.revokeObjectURL(svgUrl);
                        // Continue even if frame fails
                        completeFrame();
                    };
                    
                    img.src = svgUrl;
                } catch (error) {
                    console.error('Frame capture error:', error);
                    // Continue recording even if frame fails
                    completeFrame();
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
    // Generate timestamp for unique filenames (format: YYYY-MM-DDTHH-MM-SS)
    const isoString = new Date().toISOString(); // e.g., "2026-01-16T16:43:50.895Z"
    const timestamp = isoString.replace(/[:.]/g, '-').substring(0, 19); // e.g., "2026-01-16T16-43-50"
    
    // Determine video extension based on blob type
    const videoType = videoBlob.type;
    let videoExt = 'webm';
    if (videoType.includes('mp4')) {
        videoExt = 'mp4';
    } else if (videoType.includes('webm')) {
        videoExt = 'webm';
    }
    
    const imageFilename = `badge-photo-${timestamp}.jpg`;
    const videoFilename = `badge-video-${timestamp}.${videoExt}`;
    
    // Download static image (JPEG)
    const imageUrl = URL.createObjectURL(imageBlob);
    const imageLink = document.createElement('a');
    imageLink.href = imageUrl;
    imageLink.download = imageFilename;
    document.body.appendChild(imageLink);
    imageLink.click();
    document.body.removeChild(imageLink);
    setTimeout(() => URL.revokeObjectURL(imageUrl), 100);
    
    // Wait a bit before downloading video to avoid browser blocking
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Download video
    const videoUrl = URL.createObjectURL(videoBlob);
    const videoLink = document.createElement('a');
    videoLink.href = videoUrl;
    videoLink.download = videoFilename;
    document.body.appendChild(videoLink);
    videoLink.click();
    document.body.removeChild(videoLink);
    setTimeout(() => URL.revokeObjectURL(videoUrl), 100);
    
    // Return filenames for display
    return { image: imageFilename, video: videoFilename };
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

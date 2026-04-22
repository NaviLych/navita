const RATIO_MAP = {
    '1:1': [1, 1],
    '4:5': [4, 5],
    '3:4': [3, 4],
    '16:9': [16, 9],
    '9:16': [9, 16]
};

const state = {
    ratio: '4:5',
    direction: 'vertical',
    divider: 0.5,
    duration: 2.4,
    showLabels: true,
    loopBack: true,
    playing: true,
    beforeLabel: 'Before',
    afterLabel: 'After',
    previewProgress: 0.5,
    dragDivider: false,
    editors: {
        before: createEditorState('before'),
        after: createEditorState('after')
    }
};

const elements = {
    previewCanvas: document.getElementById('previewCanvas'),
    previewFrame: document.getElementById('previewFrame'),
    previewEmpty: document.getElementById('previewEmpty'),
    playToggle: document.getElementById('playToggle'),
    exportPngBtn: document.getElementById('exportPngBtn'),
    exportLiveBtn: document.getElementById('exportLiveBtn'),
    ratioSelect: document.getElementById('ratioSelect'),
    directionSelect: document.getElementById('directionSelect'),
    dividerRange: document.getElementById('dividerRange'),
    durationRange: document.getElementById('durationRange'),
    beforeLabel: document.getElementById('beforeLabel'),
    afterLabel: document.getElementById('afterLabel'),
    showLabels: document.getElementById('showLabels'),
    loopBack: document.getElementById('loopBack'),
    ratioValue: document.getElementById('ratioValue'),
    directionValue: document.getElementById('directionValue'),
    durationValue: document.getElementById('durationValue'),
    statusText: document.getElementById('statusText'),
    toast: document.getElementById('toast'),
    before: getEditorElements('before'),
    after: getEditorElements('after')
};

let animationFrame = null;
let previewStartedAt = performance.now();
let toastTimer = null;

init();

function createEditorState(side) {
    return {
        side,
        fileName: '',
        image: null,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        pointerId: null,
        startX: 0,
        startY: 0,
        startOffsetX: 0,
        startOffsetY: 0
    };
}

function getEditorElements(side) {
    return {
        input: document.getElementById(`${side}Input`),
        stage: document.getElementById(`${side}Stage`),
        image: document.getElementById(`${side}Image`),
        placeholder: document.getElementById(`${side}Placeholder`),
        fileName: document.getElementById(`${side}FileName`),
        zoom: document.getElementById(`${side}Zoom`),
        zoomValue: document.getElementById(`${side}ZoomValue`),
        reset: document.getElementById(`${side}Reset`)
    };
}

function init() {
    bindGlobalEvents();
    bindEditorEvents('before');
    bindEditorEvents('after');
    updateRatio();
    updateStats();
    startPreviewLoop();
}

function bindGlobalEvents() {
    elements.ratioSelect.addEventListener('change', () => {
        state.ratio = elements.ratioSelect.value;
        updateRatio();
        updateAllStages();
        renderPreview();
    });

    elements.directionSelect.addEventListener('change', () => {
        state.direction = elements.directionSelect.value;
        updateStats();
        renderPreview();
    });

    elements.dividerRange.addEventListener('input', () => {
        state.divider = Number(elements.dividerRange.value);
        state.previewProgress = state.divider;
        if (state.playing) {
            stopPreviewPlayback(false);
        }
        renderPreview();
    });

    elements.durationRange.addEventListener('input', () => {
        state.duration = Number(elements.durationRange.value);
        previewStartedAt = performance.now();
        updateStats();
    });

    elements.beforeLabel.addEventListener('input', () => {
        state.beforeLabel = elements.beforeLabel.value.trim() || 'Before';
        renderPreview();
    });

    elements.afterLabel.addEventListener('input', () => {
        state.afterLabel = elements.afterLabel.value.trim() || 'After';
        renderPreview();
    });

    elements.showLabels.addEventListener('change', () => {
        state.showLabels = elements.showLabels.checked;
        renderPreview();
    });

    elements.loopBack.addEventListener('change', () => {
        state.loopBack = elements.loopBack.checked;
        previewStartedAt = performance.now();
        renderPreview();
    });

    elements.playToggle.addEventListener('click', () => {
        if (state.playing) {
            stopPreviewPlayback(true);
        } else {
            state.playing = true;
            previewStartedAt = performance.now();
            elements.playToggle.textContent = '暂停预览';
            startPreviewLoop();
        }
    });

    elements.previewCanvas.addEventListener('pointerdown', startDividerDrag);
    window.addEventListener('pointermove', handleDividerDrag);
    window.addEventListener('pointerup', endDividerDrag);
    window.addEventListener('pointercancel', endDividerDrag);
    window.addEventListener('resize', () => {
        updateAllStages();
        renderPreview();
    });

    elements.exportPngBtn.addEventListener('click', exportPng);
    elements.exportLiveBtn.addEventListener('click', exportLiveVideo);
}

function bindEditorEvents(side) {
    const dom = elements[side];
    const editor = state.editors[side];

    dom.input.addEventListener('change', async (event) => {
        const [file] = event.target.files || [];
        if (!file) {
            return;
        }
        try {
            await loadImageFile(editor, dom, file);
            showToast(`${side === 'before' ? 'Before' : 'After'} 图片已加载`);
        } catch (error) {
            console.error(error);
            showToast('图片读取失败，请更换文件重试');
        }
    });

    dom.zoom.addEventListener('input', () => {
        editor.zoom = Number(dom.zoom.value);
        dom.zoomValue.textContent = `${Math.round(editor.zoom * 100)}%`;
        clampEditorOffset(editor, dom.stage);
        applyStageLayout(editor, dom);
        renderPreview();
    });

    dom.reset.addEventListener('click', () => {
        resetEditor(editor, dom);
        renderPreview();
    });

    dom.stage.addEventListener('pointerdown', (event) => startImageDrag(event, editor, dom));
    dom.stage.addEventListener('pointermove', (event) => handleImageDrag(event, editor, dom));
    dom.stage.addEventListener('pointerup', () => endImageDrag(editor, dom));
    dom.stage.addEventListener('pointercancel', () => endImageDrag(editor, dom));
    dom.stage.addEventListener('lostpointercapture', () => endImageDrag(editor, dom));
}

async function loadImageFile(editor, dom, file) {
    const dataUrl = await readFileAsDataURL(file);
    const image = await createImage(dataUrl);
    editor.image = image;
    editor.fileName = file.name;
    dom.fileName.textContent = file.name;
    dom.image.src = dataUrl;
    dom.placeholder.hidden = true;
    resetEditor(editor, dom);
}

function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function createImage(src) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = src;
    });
}

function resetEditor(editor, dom) {
    editor.zoom = 1;
    editor.offsetX = 0;
    editor.offsetY = 0;
    dom.zoom.value = '1';
    dom.zoomValue.textContent = '100%';
    applyStageLayout(editor, dom);
}

function updateAllStages() {
    ['before', 'after'].forEach((side) => {
        applyStageLayout(state.editors[side], elements[side]);
    });
}

function updateRatio() {
    const [ratioW, ratioH] = RATIO_MAP[state.ratio];
    document.documentElement.style.setProperty('--frame-ratio', `${ratioW} / ${ratioH}`);
    elements.ratioValue.textContent = state.ratio;
    updateStats();
}

function updateStats() {
    elements.ratioValue.textContent = state.ratio;
    elements.directionValue.textContent = state.direction === 'vertical' ? '左右对比' : '上下对比';
    elements.durationValue.textContent = `${state.duration.toFixed(1)}s`;
}

function getRenderedBox(editor, stage) {
    if (!editor.image) {
        return null;
    }

    const stageRect = stage.getBoundingClientRect();
    const baseScale = Math.max(
        stageRect.width / editor.image.naturalWidth,
        stageRect.height / editor.image.naturalHeight
    );
    const width = editor.image.naturalWidth * baseScale * editor.zoom;
    const height = editor.image.naturalHeight * baseScale * editor.zoom;

    return {
        stageWidth: stageRect.width,
        stageHeight: stageRect.height,
        width,
        height
    };
}

function clampEditorOffset(editor, stage) {
    const box = getRenderedBox(editor, stage);
    if (!box) {
        return;
    }

    const maxOffsetX = Math.max(0, (box.width - box.stageWidth) / 2);
    const maxOffsetY = Math.max(0, (box.height - box.stageHeight) / 2);

    editor.offsetX = clamp(editor.offsetX, -maxOffsetX, maxOffsetX);
    editor.offsetY = clamp(editor.offsetY, -maxOffsetY, maxOffsetY);
}

function applyStageLayout(editor, dom) {
    if (!editor.image) {
        dom.placeholder.hidden = false;
        dom.image.style.display = 'none';
        return;
    }

    clampEditorOffset(editor, dom.stage);
    const box = getRenderedBox(editor, dom.stage);
    const left = (box.stageWidth - box.width) / 2 + editor.offsetX;
    const top = (box.stageHeight - box.height) / 2 + editor.offsetY;

    dom.image.style.display = 'block';
    dom.image.style.width = `${box.width}px`;
    dom.image.style.height = `${box.height}px`;
    dom.image.style.left = `${left}px`;
    dom.image.style.top = `${top}px`;
    dom.placeholder.hidden = true;
}

function startImageDrag(event, editor, dom) {
    if (!editor.image) {
        return;
    }
    editor.pointerId = event.pointerId;
    editor.startX = event.clientX;
    editor.startY = event.clientY;
    editor.startOffsetX = editor.offsetX;
    editor.startOffsetY = editor.offsetY;
    dom.stage.setPointerCapture(event.pointerId);
}

function handleImageDrag(event, editor, dom) {
    if (editor.pointerId !== event.pointerId) {
        return;
    }

    editor.offsetX = editor.startOffsetX + (event.clientX - editor.startX);
    editor.offsetY = editor.startOffsetY + (event.clientY - editor.startY);
    clampEditorOffset(editor, dom.stage);
    applyStageLayout(editor, dom);
    renderPreview();
}

function endImageDrag(editor, dom) {
    if (editor.pointerId === null) {
        return;
    }
    if (dom.stage.hasPointerCapture(editor.pointerId)) {
        dom.stage.releasePointerCapture(editor.pointerId);
    }
    editor.pointerId = null;
}

function startDividerDrag(event) {
    if (!hasBothImages()) {
        return;
    }
    state.dragDivider = true;
    stopPreviewPlayback(false);
    updateDividerFromPointer(event);
}

function handleDividerDrag(event) {
    if (!state.dragDivider) {
        return;
    }
    updateDividerFromPointer(event);
}

function endDividerDrag() {
    state.dragDivider = false;
}

function updateDividerFromPointer(event) {
    const rect = elements.previewCanvas.getBoundingClientRect();
    const raw = state.direction === 'vertical'
        ? (event.clientX - rect.left) / rect.width
        : (event.clientY - rect.top) / rect.height;

    state.divider = clamp(raw, 0.05, 0.95);
    state.previewProgress = state.divider;
    elements.dividerRange.value = state.divider.toFixed(2);
    renderPreview();
}

function startPreviewLoop() {
    cancelAnimationFrame(animationFrame);

    const loop = (timestamp) => {
        if (state.playing) {
            const elapsed = (timestamp - previewStartedAt) / 1000;
            const cycle = Math.max(0.1, state.duration);
            const phase = (elapsed % cycle) / cycle;
            state.previewProgress = state.loopBack
                ? 0.5 - Math.cos(phase * Math.PI * 2) / 2
                : phase;
        } else {
            state.previewProgress = state.divider;
        }

        renderPreview();
        animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);
}

function stopPreviewPlayback(keepCurrentFrame) {
    state.playing = false;
    if (keepCurrentFrame) {
        state.divider = state.previewProgress;
        elements.dividerRange.value = state.divider.toFixed(2);
    }
    elements.playToggle.textContent = '播放预览';
}

function renderPreview() {
    const canvas = elements.previewCanvas;
    const ctx = canvas.getContext('2d');
    const rect = elements.previewFrame.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }

    if (!hasBothImages()) {
        elements.previewEmpty.hidden = false;
        ctx.clearRect(0, 0, width, height);
        return;
    }

    elements.previewEmpty.hidden = true;
    drawComposite(ctx, width, height, state.previewProgress, true);
}

function drawComposite(ctx, width, height, progress, withBackdrop) {
    ctx.clearRect(0, 0, width, height);

    if (withBackdrop) {
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#0f1730');
        gradient.addColorStop(1, '#111f3b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    drawEditorImage(ctx, state.editors.after, elements.after.stage, width, height);

    ctx.save();
    if (state.direction === 'vertical') {
        const dividerX = progress * width;
        ctx.beginPath();
        ctx.rect(0, 0, dividerX, height);
    } else {
        const dividerY = progress * height;
        ctx.beginPath();
        ctx.rect(0, 0, width, dividerY);
    }
    ctx.clip();
    drawEditorImage(ctx, state.editors.before, elements.before.stage, width, height);
    ctx.restore();

    drawDivider(ctx, width, height, progress);

    if (state.showLabels) {
        drawLabel(ctx, state.beforeLabel, 20, 20, 'left');
        drawLabel(
            ctx,
            state.afterLabel,
            width - 20,
            20,
            'right'
        );
    }
}

function drawEditorImage(ctx, editor, stage, outputWidth, outputHeight) {
    if (!editor.image) {
        return;
    }

    const stageRect = stage.getBoundingClientRect();
    const baseScale = Math.max(
        outputWidth / editor.image.naturalWidth,
        outputHeight / editor.image.naturalHeight
    );
    const width = editor.image.naturalWidth * baseScale * editor.zoom;
    const height = editor.image.naturalHeight * baseScale * editor.zoom;
    const offsetX = stageRect.width ? editor.offsetX * (outputWidth / stageRect.width) : 0;
    const offsetY = stageRect.height ? editor.offsetY * (outputHeight / stageRect.height) : 0;
    const left = (outputWidth - width) / 2 + offsetX;
    const top = (outputHeight - height) / 2 + offsetY;

    ctx.drawImage(editor.image, left, top, width, height);
}

function drawDivider(ctx, width, height, progress) {
    const lineWidth = Math.max(2, Math.round(Math.min(width, height) * 0.008));
    const knobRadius = Math.max(12, Math.round(Math.min(width, height) * 0.035));

    ctx.save();
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = 'rgba(255,255,255,0.95)';
    ctx.shadowColor = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur = 12;

    if (state.direction === 'vertical') {
        const x = progress * width;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
        drawKnob(ctx, x, height / 2, knobRadius, true);
    } else {
        const y = progress * height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        drawKnob(ctx, width / 2, y, knobRadius, false);
    }

    ctx.restore();
}

function drawKnob(ctx, x, y, radius, vertical) {
    ctx.fillStyle = 'rgba(255,255,255,0.98)';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = 'rgba(99, 123, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(52, 70, 120, 0.6)';
    ctx.lineWidth = 2;
    const gap = radius * 0.34;
    const length = radius * 0.42;

    ctx.beginPath();
    if (vertical) {
        ctx.moveTo(x - gap, y - length);
        ctx.lineTo(x - gap, y + length);
        ctx.moveTo(x + gap, y - length);
        ctx.lineTo(x + gap, y + length);
    } else {
        ctx.moveTo(x - length, y - gap);
        ctx.lineTo(x + length, y - gap);
        ctx.moveTo(x - length, y + gap);
        ctx.lineTo(x + length, y + gap);
    }
    ctx.stroke();
}

function drawLabel(ctx, text, x, y, align) {
    const paddingX = 14;
    const paddingY = 10;
    const radius = 999;
    ctx.save();
    ctx.font = `600 ${Math.max(14, Math.round(ctx.canvas.width * 0.03))}px Inter, sans-serif`;
    const metrics = ctx.measureText(text);
    const width = metrics.width + paddingX * 2;
    const height = Math.max(36, Math.round(ctx.canvas.height * 0.085));
    const boxX = align === 'right' ? x - width : x;

    roundRect(ctx, boxX, y, width, height, radius);
    ctx.fillStyle = 'rgba(8, 14, 28, 0.62)';
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, boxX + paddingX, y + height / 2);
    ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.arcTo(x + width, y + height, x, y + height, r);
    ctx.arcTo(x, y + height, x, y, r);
    ctx.arcTo(x, y, x + width, y, r);
    ctx.closePath();
}

function hasBothImages() {
    return Boolean(state.editors.before.image && state.editors.after.image);
}

function buildExportCanvas() {
    const [ratioW, ratioH] = RATIO_MAP[state.ratio];
    const longEdge = 1440;
    const width = ratioW >= ratioH ? longEdge : Math.round((longEdge * ratioW) / ratioH);
    const height = ratioH > ratioW ? longEdge : Math.round((longEdge * ratioH) / ratioW);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function exportPng() {
    if (!hasBothImages()) {
        showToast('请先上传 before / after 两张图片');
        return;
    }

    const canvas = buildExportCanvas();
    const ctx = canvas.getContext('2d');
    drawComposite(ctx, canvas.width, canvas.height, state.divider, false);
    canvas.toBlob((blob) => {
        if (!blob) {
            showToast('PNG 导出失败');
            return;
        }
        downloadBlob(blob, `before-after-${Date.now()}.png`);
        showToast('PNG 已导出');
    }, 'image/png');
}

async function exportLiveVideo() {
    if (!hasBothImages()) {
        showToast('请先上传 before / after 两张图片');
        return;
    }

    if (typeof MediaRecorder === 'undefined') {
        showToast('当前浏览器不支持动态导出，请更换 Chromium 浏览器');
        return;
    }

    const canvas = buildExportCanvas();
    const ctx = canvas.getContext('2d');
    const mimeType = getSupportedVideoType();
    if (!mimeType) {
        showToast('当前浏览器缺少 WebM 导出支持');
        return;
    }

    setExporting(true, '正在生成动态 Live 图…');

    try {
        const stream = canvas.captureStream(30);
        const chunks = [];
        const recorder = new MediaRecorder(stream, { mimeType });

        recorder.ondataavailable = (event) => {
            if (event.data && event.data.size > 0) {
                chunks.push(event.data);
            }
        };

        const finished = new Promise((resolve) => {
            recorder.onstop = resolve;
        });

        recorder.start();
        await renderAnimationFrames(canvas, ctx);
        recorder.stop();
        await finished;

        const blob = new Blob(chunks, { type: mimeType });
        downloadBlob(blob, `before-after-live-${Date.now()}.webm`);
        showToast('动态 Live 图已导出');
        setExporting(false, '动态导出为 WebM，可直接预览动画效果。');
    } catch (error) {
        console.error(error);
        setExporting(false, '动态导出失败，请重试。');
        showToast('动态导出失败，请重试');
    }
}

function getSupportedVideoType() {
    const candidates = [
        'video/webm;codecs=vp9',
        'video/webm;codecs=vp8',
        'video/webm'
    ];

    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
}

function renderAnimationFrames(canvas, ctx) {
    const durationMs = state.loopBack ? state.duration * 2000 : state.duration * 1000;

    return new Promise((resolve) => {
        const start = performance.now();

        const render = (timestamp) => {
            const elapsed = timestamp - start;
            const progress = Math.min(1, elapsed / durationMs);
            const reveal = state.loopBack
                ? 0.5 - Math.cos(progress * Math.PI * 2) / 2
                : progress;

            drawComposite(ctx, canvas.width, canvas.height, reveal, false);

            if (elapsed < durationMs) {
                requestAnimationFrame(render);
            } else {
                resolve();
            }
        };

        requestAnimationFrame(render);
    });
}

function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function setExporting(exporting, message) {
    elements.exportLiveBtn.disabled = exporting;
    elements.exportPngBtn.disabled = exporting;
    elements.statusText.textContent = message;
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    toastTimer = setTimeout(() => {
        elements.toast.hidden = true;
    }, 2200);
}

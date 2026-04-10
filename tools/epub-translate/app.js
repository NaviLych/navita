class EPUBTranslateApp {
    constructor() {
        this.file = null;
        this.zip = null;
        this.metadata = {};
        this.manifest = new Map();
        this.chapters = [];
        this.opfPath = '';
        this.opfDir = '';
        this.outputBlob = null;
        this.outputFileName = '';
        this.activeChapterIndex = null;

        this.initElements();
        this.loadSavedSettings();
        this.bindEvents();
    }

    initElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.selectFileBtn = document.getElementById('selectFileBtn');
        this.fileCard = document.getElementById('fileCard');
        this.fileName = document.getElementById('fileName');
        this.fileMeta = document.getElementById('fileMeta');
        this.removeFileBtn = document.getElementById('removeFileBtn');

        this.settingsPanel = document.getElementById('settingsPanel');
        this.apiBaseUrl = document.getElementById('apiBaseUrl');
        this.modelName = document.getElementById('modelName');
        this.apiKey = document.getElementById('apiKey');
        this.targetLanguage = document.getElementById('targetLanguage');
        this.systemPrompt = document.getElementById('systemPrompt');
        this.analyzeBtn = document.getElementById('analyzeBtn');

        this.reviewPanel = document.getElementById('reviewPanel');
        this.bookTitle = document.getElementById('bookTitle');
        this.bookAuthor = document.getElementById('bookAuthor');
        this.chapterCount = document.getElementById('chapterCount');
        this.paragraphCount = document.getElementById('paragraphCount');
        this.startChapter = document.getElementById('startChapter');
        this.endChapter = document.getElementById('endChapter');
        this.selectionSummary = document.getElementById('selectionSummary');
        this.chapterList = document.getElementById('chapterList');
        this.previewCard = document.getElementById('previewCard');
        this.previewLabel = document.getElementById('previewLabel');
        this.translateBtn = document.getElementById('translateBtn');

        this.progressPanel = document.getElementById('progressPanel');
        this.progressStatus = document.getElementById('progressStatus');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.progressPercent = document.getElementById('progressPercent');
        this.logList = document.getElementById('logList');

        this.resultPanel = document.getElementById('resultPanel');
        this.resultSummary = document.getElementById('resultSummary');
        this.resultFileName = document.getElementById('resultFileName');
        this.resultFileMeta = document.getElementById('resultFileMeta');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
    }

    loadSavedSettings() {
        this.apiBaseUrl.value = localStorage.getItem('epub-translate-api-base') || 'https://api.openai.com/v1';
        this.modelName.value = localStorage.getItem('epub-translate-model') || '';
        this.targetLanguage.value = localStorage.getItem('epub-translate-target-language') || '简体中文';
        this.systemPrompt.value = localStorage.getItem('epub-translate-system-prompt') || '';
    }

    saveSettings() {
        localStorage.setItem('epub-translate-api-base', this.apiBaseUrl.value.trim());
        localStorage.setItem('epub-translate-model', this.modelName.value.trim());
        localStorage.setItem('epub-translate-target-language', this.targetLanguage.value.trim());
        localStorage.setItem('epub-translate-system-prompt', this.systemPrompt.value);
    }

    bindEvents() {
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.selectFileBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            this.fileInput.click();
        });
        this.fileInput.addEventListener('change', (event) => {
            const [file] = event.target.files;
            if (file) {
                this.loadFile(file);
            }
        });
        this.removeFileBtn.addEventListener('click', () => this.resetFileState());

        this.uploadArea.addEventListener('dragover', (event) => {
            event.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });
        this.uploadArea.addEventListener('drop', (event) => {
            event.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            const [file] = event.dataTransfer.files || [];
            if (file) {
                this.loadFile(file);
            }
        });

        ['input', 'change'].forEach((eventName) => {
            this.apiBaseUrl.addEventListener(eventName, () => this.saveSettings());
            this.modelName.addEventListener(eventName, () => this.saveSettings());
            this.targetLanguage.addEventListener(eventName, () => this.saveSettings());
            this.systemPrompt.addEventListener(eventName, () => this.saveSettings());
        });

        this.analyzeBtn.addEventListener('click', () => this.analyzeEPUB());
        this.startChapter.addEventListener('change', () => this.updateRangeUI());
        this.endChapter.addEventListener('change', () => this.updateRangeUI());
        this.translateBtn.addEventListener('click', () => this.translateSelectedRange());
        this.downloadBtn.addEventListener('click', () => this.downloadResult());
        this.resetBtn.addEventListener('click', () => this.resetAll());
    }

    loadFile(file) {
        if (!file.name.toLowerCase().endsWith('.epub')) {
            alert('请选择 EPUB 文件。');
            return;
        }

        this.file = file;
        this.fileName.textContent = file.name;
        this.fileMeta.textContent = `${this.formatSize(file.size)} · ${file.type || 'application/epub+zip'}`;
        this.fileCard.hidden = false;
        this.uploadArea.hidden = true;
        this.settingsPanel.hidden = false;
        this.reviewPanel.hidden = true;
        this.progressPanel.hidden = true;
        this.resultPanel.hidden = true;
        this.outputBlob = null;
    }

    resetFileState() {
        this.file = null;
        this.fileInput.value = '';
        this.fileCard.hidden = true;
        this.uploadArea.hidden = false;
        this.settingsPanel.hidden = true;
        this.reviewPanel.hidden = true;
        this.progressPanel.hidden = true;
        this.resultPanel.hidden = true;
        this.outputBlob = null;
        this.outputFileName = '';
        this.activeChapterIndex = null;
        this.metadata = {};
        this.manifest = new Map();
        this.chapters = [];
        this.logList.innerHTML = '';
        this.chapterList.innerHTML = '';
        this.previewCard.innerHTML = '<p class="empty-text">分析完成后，点击左侧章节查看内容摘要。</p>';
        this.previewLabel.textContent = '未选择章节';
    }

    resetAll() {
        this.apiKey.value = '';
        this.resetFileState();
    }

    async analyzeEPUB() {
        if (!this.file) {
            alert('请先上传 EPUB 文件。');
            return;
        }

        this.saveSettings();
        this.analyzeBtn.disabled = true;
        this.analyzeBtn.textContent = '分析中…';

        try {
            const buffer = await this.file.arrayBuffer();
            this.zip = await JSZip.loadAsync(buffer);
            await this.parseEPUBStructure();
            this.renderReviewPanel();
            this.reviewPanel.hidden = false;
            this.progressPanel.hidden = true;
            this.resultPanel.hidden = true;
        } catch (error) {
            console.error(error);
            alert(`分析 EPUB 失败：${error.message}`);
        } finally {
            this.analyzeBtn.disabled = false;
            this.analyzeBtn.textContent = '分析 EPUB 结构';
        }
    }

    async parseEPUBStructure() {
        const containerXml = await this.getZipText('META-INF/container.xml');
        if (!containerXml) {
            throw new Error('找不到 META-INF/container.xml。');
        }

        const parser = new DOMParser();
        const containerDoc = parser.parseFromString(containerXml, 'application/xml');
        const rootfile = containerDoc.querySelector('rootfile');
        const opfPath = rootfile?.getAttribute('full-path');

        if (!opfPath) {
            throw new Error('找不到 OPF 文件路径。');
        }

        this.opfPath = this.normalizePath(opfPath);
        this.opfDir = this.opfPath.includes('/') ? this.opfPath.slice(0, this.opfPath.lastIndexOf('/') + 1) : '';

        const opfText = await this.getZipText(this.opfPath);
        if (!opfText) {
            throw new Error(`无法读取 OPF 文件：${this.opfPath}`);
        }

        const opfDoc = parser.parseFromString(opfText, 'application/xml');
        this.parseMetadata(opfDoc);
        await this.parseManifest(opfDoc);
        await this.parseSpine(opfDoc);
    }

    parseMetadata(opfDoc) {
        const metadata = opfDoc.querySelector('metadata');
        const title =
            metadata?.querySelector('dc\\:title, title, [*|title]')?.textContent?.trim() ||
            this.file.name.replace(/\.epub$/i, '');
        const author =
            metadata?.querySelector('dc\\:creator, creator, [*|creator]')?.textContent?.trim() ||
            '未知作者';
        const language =
            metadata?.querySelector('dc\\:language, language, [*|language]')?.textContent?.trim() ||
            'en';
        const identifier =
            metadata?.querySelector('dc\\:identifier, identifier, [*|identifier]')?.textContent?.trim() ||
            `navita-${Date.now()}`;

        this.metadata = { title, author, language, identifier };
    }

    async parseManifest(opfDoc) {
        this.manifest = new Map();
        const items = opfDoc.querySelectorAll('manifest > item');

        for (const item of items) {
            const id = item.getAttribute('id');
            const hrefRaw = item.getAttribute('href') || '';
            const href = this.safeDecodeURIComponent(hrefRaw);
            const fullPath = this.resolveFromOpf(href);
            const mediaType = item.getAttribute('media-type') || '';
            const zipName = this.findZipFileName(fullPath) || this.findZipFileName(this.resolveFromOpf(hrefRaw)) || fullPath;
            const size = await this.getZipFileSize(zipName);

            this.manifest.set(id, {
                id,
                href,
                hrefRaw,
                fullPath: zipName,
                mediaType,
                properties: item.getAttribute('properties') || '',
                size,
                isContent: /xhtml|html|xml/i.test(mediaType)
            });
        }
    }

    async parseSpine(opfDoc) {
        this.chapters = [];
        const itemrefs = opfDoc.querySelectorAll('spine > itemref');

        for (let index = 0; index < itemrefs.length; index += 1) {
            const idref = itemrefs[index].getAttribute('idref');
            const manifestItem = this.manifest.get(idref);
            if (!manifestItem || !manifestItem.isContent) {
                continue;
            }

            const sourceText = await this.getZipText(manifestItem.fullPath);
            if (!sourceText) {
                continue;
            }

            const analysis = this.inspectChapter(sourceText, manifestItem.mediaType);

            this.chapters.push({
                index: this.chapters.length + 1,
                id: idref,
                title: analysis.title || `第 ${this.chapters.length + 1} 章`,
                fullPath: manifestItem.fullPath,
                href: manifestItem.href,
                mediaType: manifestItem.mediaType,
                sourceText,
                paragraphCount: analysis.paragraphCount,
                snippet: analysis.snippet,
                textLength: analysis.textLength,
                bodyTagName: analysis.bodyTagName
            });
        }

        if (!this.chapters.length) {
            throw new Error('没有找到可处理的章节内容。');
        }
    }

    inspectChapter(sourceText, mediaType) {
        const { doc } = this.parseMarkup(sourceText, mediaType);
        const title =
            doc.querySelector('title')?.textContent?.trim() ||
            doc.querySelector('h1, h2, h3')?.textContent?.trim() ||
            '';
        const blocks = this.collectTranslatableBlocks(doc);
        const snippet = blocks
            .slice(0, 3)
            .map((element) => this.normalizeText(element.textContent))
            .filter(Boolean);
        const textLength = blocks.reduce((sum, element) => sum + this.normalizeText(element.textContent).length, 0);
        const bodyTagName = doc.querySelector('body')?.tagName?.toLowerCase() || 'body';

        return {
            title,
            paragraphCount: blocks.length,
            snippet,
            textLength,
            bodyTagName
        };
    }

    renderReviewPanel() {
        this.bookTitle.textContent = this.metadata.title;
        this.bookAuthor.textContent = this.metadata.author;
        this.chapterCount.textContent = `${this.chapters.length} 章`;
        this.paragraphCount.textContent = `${this.chapters.reduce((sum, chapter) => sum + chapter.paragraphCount, 0)} 段`;

        const options = this.chapters
            .map((chapter) => `<option value="${chapter.index}">#${chapter.index} · ${this.escapeHTML(chapter.title)}</option>`)
            .join('');
        this.startChapter.innerHTML = options;
        this.endChapter.innerHTML = options;
        this.startChapter.value = '1';
        this.endChapter.value = String(this.chapters[this.chapters.length - 1].index);

        this.chapterList.innerHTML = this.chapters
            .map(
                (chapter) => `
                    <button class="chapter-item" type="button" data-index="${chapter.index}">
                        <div class="chapter-topline">
                            <span>#${chapter.index}</span>
                            <span>${chapter.paragraphCount} 段</span>
                        </div>
                        <div class="chapter-title">${this.escapeHTML(chapter.title)}</div>
                        <div class="chapter-meta">${this.escapeHTML(chapter.href)} · ${this.formatCompactSize(chapter.textLength)}</div>
                    </button>
                `
            )
            .join('');

        this.chapterList.querySelectorAll('.chapter-item').forEach((button) => {
            button.addEventListener('click', () => {
                const index = Number(button.dataset.index);
                this.activeChapterIndex = index;
                this.renderChapterPreview(index);
                this.updateRangeUI();
            });
        });

        this.activeChapterIndex = this.chapters[0]?.index ?? null;
        if (this.activeChapterIndex !== null) {
            this.renderChapterPreview(this.activeChapterIndex);
        }
        this.updateRangeUI();
    }

    renderChapterPreview(index) {
        const chapter = this.chapters.find((item) => item.index === index);
        if (!chapter) {
            return;
        }

        this.previewLabel.textContent = `第 ${chapter.index} 章`;
        const snippetHtml = chapter.snippet.length
            ? chapter.snippet.map((text) => `<p>${this.escapeHTML(text)}</p>`).join('')
            : '<p class="empty-text">该章节没有检测到适合逐段翻译的段落。</p>';

        this.previewCard.innerHTML = `
            <h4>${this.escapeHTML(chapter.title)}</h4>
            <div class="preview-meta">${this.escapeHTML(chapter.href)} · ${chapter.paragraphCount} 段 · ${chapter.bodyTagName}</div>
            <div class="preview-snippet">${snippetHtml}</div>
        `;

        this.chapterList.querySelectorAll('.chapter-item').forEach((button) => {
            button.classList.toggle('active', Number(button.dataset.index) === index);
        });
    }

    updateRangeUI() {
        const start = Number(this.startChapter.value || 1);
        const end = Number(this.endChapter.value || this.chapters.length);
        const validRange = start <= end;
        const selected = this.chapters.filter((chapter) => chapter.index >= start && chapter.index <= end);
        const paragraphTotal = selected.reduce((sum, chapter) => sum + chapter.paragraphCount, 0);

        this.selectionSummary.textContent = validRange
            ? `${selected.length} 章 · ${paragraphTotal} 段`
            : '起始章节必须不大于结束章节';
        this.translateBtn.disabled = !validRange || !selected.length || !paragraphTotal;

        this.chapterList.querySelectorAll('.chapter-item').forEach((button) => {
            const index = Number(button.dataset.index);
            button.classList.toggle('in-range', validRange && index >= start && index <= end);
        });
    }

    async translateSelectedRange() {
        if (!this.validateTranslationConfig()) {
            return;
        }

        const start = Number(this.startChapter.value);
        const end = Number(this.endChapter.value);
        if (start > end) {
            alert('起始章节不能大于结束章节。');
            return;
        }

        const selectedChapters = this.chapters.filter((chapter) => chapter.index >= start && chapter.index <= end);
        const totalParagraphs = selectedChapters.reduce((sum, chapter) => sum + chapter.paragraphCount, 0);
        if (!totalParagraphs) {
            alert('所选范围内没有可翻译段落。');
            return;
        }

        this.saveSettings();
        this.translateBtn.disabled = true;
        this.analyzeBtn.disabled = true;
        this.outputBlob = null;
        this.logList.innerHTML = '';
        this.progressPanel.hidden = false;
        this.resultPanel.hidden = true;
        this.updateProgress(0, 0, totalParagraphs, '准备开始翻译…');
        this.addLog(`准备翻译章节 ${start}-${end}，共 ${selectedChapters.length} 章 / ${totalParagraphs} 段。`);

        try {
            const translatedChapterMap = new Map();
            let completedParagraphs = 0;

            for (const chapter of selectedChapters) {
                this.progressStatus.textContent = `正在翻译第 ${chapter.index} 章：${chapter.title}`;
                this.addLog(`开始处理第 ${chapter.index} 章《${chapter.title}》`);

                const translatedSource = await this.translateChapter(chapter, (doneInChapter, totalInChapter) => {
                    this.updateProgress(
                        completedParagraphs + doneInChapter,
                        completedParagraphs + doneInChapter,
                        totalParagraphs,
                        `第 ${chapter.index} 章 ${doneInChapter}/${totalInChapter} 段`
                    );
                });

                translatedChapterMap.set(chapter.fullPath, translatedSource);
                completedParagraphs += chapter.paragraphCount;
                this.addLog(`完成第 ${chapter.index} 章，共写回 ${chapter.paragraphCount} 段译文。`, 'success');
                this.updateProgress(completedParagraphs, completedParagraphs, totalParagraphs, `已完成 ${completedParagraphs}/${totalParagraphs} 段`);
            }

            this.progressStatus.textContent = '正在打包新的 EPUB…';
            this.outputBlob = await this.buildTranslatedEPUB(translatedChapterMap);
            this.outputFileName = this.buildOutputFileName(start, end);
            this.showResult(selectedChapters.length, totalParagraphs);
        } catch (error) {
            console.error(error);
            this.addLog(`翻译失败：${error.message}`, 'error');
            alert(`翻译失败：${error.message}`);
        } finally {
            this.translateBtn.disabled = false;
            this.analyzeBtn.disabled = false;
        }
    }

    validateTranslationConfig() {
        if (!this.apiBaseUrl.value.trim()) {
            alert('请输入 Base URL。');
            return false;
        }
        if (!this.modelName.value.trim()) {
            alert('请输入模型名称。');
            return false;
        }
        if (!this.apiKey.value.trim()) {
            alert('请输入 API Key。');
            return false;
        }
        if (!this.targetLanguage.value.trim()) {
            alert('请输入目标语言。');
            return false;
        }
        return true;
    }

    async translateChapter(chapter, onProgress) {
        const { doc, isXml } = this.parseMarkup(chapter.sourceText, chapter.mediaType);
        const blocks = this.collectTranslatableBlocks(doc);

        if (!blocks.length) {
            return chapter.sourceText;
        }

        for (let i = 0; i < blocks.length; i += 1) {
            const block = blocks[i];
            const originalText = this.normalizeText(block.textContent);
            if (!originalText) {
                onProgress(i + 1, blocks.length);
                continue;
            }

            const translated = await this.requestTranslation({
                chapterTitle: chapter.title,
                text: originalText
            });

            const translationNode = this.createTranslationParagraph(doc, translated, isXml);
            block.parentNode.insertBefore(translationNode, block.nextSibling);
            onProgress(i + 1, blocks.length);
        }

        return this.serializeDocument(doc, isXml);
    }

    async requestTranslation({ chapterTitle, text }) {
        const endpoint = this.buildChatCompletionsEndpoint(this.apiBaseUrl.value.trim());
        const language = this.targetLanguage.value.trim();
        const extraSystemPrompt = this.systemPrompt.value.trim();

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${this.apiKey.value.trim()}`
            },
            body: JSON.stringify({
                model: this.modelName.value.trim(),
                temperature: 0.2,
                messages: [
                    {
                        role: 'system',
                        content: [
                            `You translate EPUB paragraphs into ${language}.`,
                            'Return only the translated paragraph text.',
                            'Do not add explanations, notes, quotation marks, or prefixes.',
                            'Keep names, tone, and paragraph boundaries natural.',
                            extraSystemPrompt
                        ]
                            .filter(Boolean)
                            .join(' ')
                    },
                    {
                        role: 'user',
                        content: `Chapter: ${chapterTitle}\n\nParagraph:\n${text}`
                    }
                ]
            })
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            const message = data?.error?.message || data?.message || `HTTP ${response.status}`;
            throw new Error(message);
        }

        const content = data?.choices?.[0]?.message?.content;
        const translated = this.extractMessageContent(content);
        if (!translated) {
            throw new Error('API 没有返回可用译文。');
        }

        return translated.trim();
    }

    createTranslationParagraph(doc, text, isXml) {
        const namespace = doc.documentElement?.namespaceURI || 'http://www.w3.org/1999/xhtml';
        const paragraph = isXml ? doc.createElementNS(namespace, 'p') : doc.createElement('p');
        paragraph.setAttribute('class', 'navita-translation');
        paragraph.setAttribute('data-navita-translation', 'true');
        paragraph.setAttribute('style', 'margin:0.35em 0 1em; opacity:0.86; font-style:italic;');
        paragraph.textContent = text;
        return paragraph;
    }

    async buildTranslatedEPUB(translatedChapterMap) {
        const newZip = new JSZip();
        const allNames = Object.keys(this.zip.files).sort((a, b) => {
            if (a === 'mimetype') return -1;
            if (b === 'mimetype') return 1;
            return a.localeCompare(b);
        });

        for (const name of allNames) {
            const entry = this.zip.files[name];
            if (entry.dir) {
                newZip.folder(name);
                continue;
            }

            if (name === 'mimetype') {
                const mimetype = await entry.async('string');
                newZip.file(name, mimetype, { compression: 'STORE' });
                continue;
            }

            if (translatedChapterMap.has(name)) {
                newZip.file(name, translatedChapterMap.get(name));
            } else {
                const bytes = await entry.async('uint8array');
                newZip.file(name, bytes);
            }
        }

        return newZip.generateAsync({
            type: 'blob',
            mimeType: 'application/epub+zip',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
    }

    showResult(chapterCount, paragraphCount) {
        this.progressStatus.textContent = '翻译与打包完成。';
        this.updateProgress(paragraphCount, paragraphCount, paragraphCount, '全部完成');
        this.resultPanel.hidden = false;
        this.resultFileName.textContent = this.outputFileName;
        this.resultFileMeta.textContent = `${this.formatSize(this.outputBlob.size)} · ${chapterCount} 章 · ${paragraphCount} 段译文`;
        this.resultSummary.textContent = `已将译文作为新段落写回所选章节，可直接下载新的 EPUB。`;
    }

    downloadResult() {
        if (!this.outputBlob) {
            return;
        }

        const url = URL.createObjectURL(this.outputBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = this.outputFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    updateProgress(completed, current, total, statusText) {
        const percent = total ? Math.min(100, Math.round((completed / total) * 100)) : 0;
        this.progressFill.style.width = `${percent}%`;
        this.progressText.textContent = `${current} / ${total}`;
        this.progressPercent.textContent = `${percent}%`;
        this.progressStatus.textContent = statusText;
    }

    addLog(message, type = 'info') {
        const item = document.createElement('div');
        item.className = `log-item ${type}`;
        item.innerHTML = `${this.escapeHTML(message)}<span>${new Date().toLocaleTimeString()}</span>`;
        this.logList.prepend(item);
    }

    parseMarkup(text, mediaType) {
        const parser = new DOMParser();
        let doc = parser.parseFromString(text, 'application/xhtml+xml');
        let isXml = true;

        if (doc.querySelector('parsererror')) {
            doc = parser.parseFromString(text, mediaType?.includes('xml') ? 'application/xml' : 'text/html');
            isXml = !doc.querySelector('html') || mediaType?.includes('xml');
        }

        return { doc, isXml };
    }

    collectTranslatableBlocks(doc) {
        const body = doc.querySelector('body');
        if (!body) {
            return [];
        }

        return Array.from(body.querySelectorAll('p'))
            .filter((element) => !element.closest('[data-navita-translation="true"]'))
            .filter((element) => !element.hasAttribute('data-navita-translation'))
            .filter((element) => this.normalizeText(element.textContent).length > 0);
    }

    serializeDocument(doc, isXml) {
        if (!isXml && doc.documentElement?.outerHTML) {
            return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`;
        }

        const serialized = new XMLSerializer().serializeToString(doc);
        return serialized.startsWith('<?xml') ? serialized : `<?xml version="1.0" encoding="utf-8"?>\n${serialized}`;
    }

    buildChatCompletionsEndpoint(baseUrl) {
        const trimmed = baseUrl.replace(/\/+$/, '');
        return trimmed.endsWith('/chat/completions') ? trimmed : `${trimmed}/chat/completions`;
    }

    buildOutputFileName(start, end) {
        const baseName = this.file.name.replace(/\.epub$/i, '');
        const languageSlug = this.targetLanguage.value.trim().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '') || 'translated';
        return `${baseName}-${languageSlug}-${start}-${end}.epub`;
    }

    findZipFileName(path) {
        const normalized = this.normalizePath(path);
        return this.zip.files[normalized]
            ? normalized
            : Object.keys(this.zip.files).find((name) => this.normalizePath(this.safeDecodeURIComponent(name)) === normalized) || null;
    }

    async getZipText(path) {
        const fileName = this.findZipFileName(path);
        if (!fileName) {
            return null;
        }
        return this.zip.file(fileName)?.async('text') || null;
    }

    async getZipFileSize(path) {
        const fileName = this.findZipFileName(path);
        if (!fileName) {
            return 0;
        }
        const bytes = await this.zip.file(fileName)?.async('uint8array');
        return bytes?.length || 0;
    }

    resolveFromOpf(relativePath) {
        return this.normalizePath(`${this.opfDir}${this.safeDecodeURIComponent(relativePath)}`);
    }

    normalizePath(path) {
        const parts = [];
        path.split('/').forEach((part) => {
            if (!part || part === '.') {
                return;
            }
            if (part === '..') {
                parts.pop();
                return;
            }
            parts.push(part);
        });
        return parts.join('/');
    }

    safeDecodeURIComponent(value) {
        try {
            return decodeURIComponent(value);
        } catch (error) {
            return value;
        }
    }

    extractMessageContent(content) {
        if (typeof content === 'string') {
            return content;
        }
        if (Array.isArray(content)) {
            return content
                .map((item) => {
                    if (typeof item === 'string') {
                        return item;
                    }
                    return item?.text || item?.content || '';
                })
                .join('')
                .trim();
        }
        return '';
    }

    normalizeText(text) {
        return (text || '').replace(/\s+/g, ' ').trim();
    }

    formatSize(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    formatCompactSize(length) {
        if (length < 1000) return `${length} 字`;
        return `${(length / 1000).toFixed(1)}k 字`;
    }

    escapeHTML(text) {
        return String(text || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}

window.epubTranslateApp = new EPUBTranslateApp();

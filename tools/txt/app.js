/**
 * EPUB 转 TXT 工具
 * 将 EPUB 电子书转换为纯文本格式
 */

// Constants
const MAX_CHAPTER_TITLE_LENGTH = 50;
const DEFAULT_COMPRESSION_LEVEL = 6; // Balance between compression ratio and speed

class EPUBToTxtConverter {
    constructor() {
        this.file = null;
        this.zip = null;
        this.metadata = {};
        this.manifest = new Map();
        this.chapters = [];
        this.resultFiles = [];
        this.opfPath = '';
        this.opfDir = '';
        
        this.initElements();
        this.bindEvents();
    }

    initElements() {
        // Upload elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.selectFileBtn = document.getElementById('selectFileBtn');
        this.fileInfo = document.getElementById('fileInfo');
        this.fileName = document.getElementById('fileName');
        this.fileSize = document.getElementById('fileSize');
        this.removeFileBtn = document.getElementById('removeFileBtn');

        // Settings elements
        this.settingsSection = document.getElementById('settingsSection');
        this.outputFormat = document.getElementById('outputFormat');
        this.chapterSeparator = document.getElementById('chapterSeparator');
        this.convertBtn = document.getElementById('convertBtn');

        // Preview elements
        this.previewSection = document.getElementById('previewSection');
        this.bookTitle = document.getElementById('bookTitle');
        this.bookAuthor = document.getElementById('bookAuthor');
        this.totalChapters = document.getElementById('totalChapters');
        this.chapterList = document.getElementById('chapterList');

        // Progress elements
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.progressLog = document.getElementById('progressLog');

        // Result elements
        this.resultSection = document.getElementById('resultSection');
        this.resultCount = document.getElementById('resultCount');
        this.resultFilesEl = document.getElementById('resultFiles');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        this.resetBtn = document.getElementById('resetBtn');
    }

    bindEvents() {
        // File upload
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.selectFileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.removeFileBtn.addEventListener('click', () => this.removeFile());

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadArea.classList.add('drag-over');
        });
        this.uploadArea.addEventListener('dragleave', () => {
            this.uploadArea.classList.remove('drag-over');
        });
        this.uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadArea.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].name.endsWith('.epub')) {
                this.loadFile(files[0]);
            }
        });

        // Buttons
        this.convertBtn.addEventListener('click', () => this.convert());
        this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
        this.resetBtn.addEventListener('click', () => this.reset());
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.loadFile(files[0]);
        }
    }

    async loadFile(file) {
        this.file = file;
        this.fileName.textContent = file.name;
        this.fileSize.textContent = this.formatSize(file.size);
        this.uploadArea.hidden = true;
        this.fileInfo.hidden = false;
        this.settingsSection.hidden = false;

        // 自动解析 EPUB
        await this.parseEPUB();
    }

    removeFile() {
        this.file = null;
        this.zip = null;
        this.fileInput.value = '';
        this.uploadArea.hidden = false;
        this.fileInfo.hidden = true;
        this.settingsSection.hidden = true;
        this.previewSection.hidden = true;
    }

    formatSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    async ensureJSZip() {
        if (typeof JSZip !== 'undefined') {
            return;
        }

        await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.crossOrigin = 'anonymous';
            script.referrerPolicy = 'no-referrer';
            script.onload = resolve;
            script.onerror = () => reject(new Error('JSZip 依赖加载失败'));
            document.head.appendChild(script);
        });

        if (typeof JSZip === 'undefined') {
            throw new Error('JSZip 依赖加载失败，请检查网络后重试');
        }
    }

    async parseEPUB() {
        try {
            await this.ensureJSZip();

            // 读取 EPUB 文件
            const arrayBuffer = await this.file.arrayBuffer();
            this.zip = await JSZip.loadAsync(arrayBuffer);

            // 解析 EPUB 结构
            await this.parseEPUBStructure();

            // 显示预览
            this.showPreview();

            this.previewSection.hidden = false;
        } catch (error) {
            console.error('解析 EPUB 失败:', error);
            alert('解析 EPUB 文件失败: ' + error.message);
        }
    }

    async parseEPUBStructure() {
        // 找到 container.xml
        const containerXml = await this.zip.file('META-INF/container.xml')?.async('text');
        if (!containerXml) {
            throw new Error('无效的 EPUB 文件：找不到 container.xml');
        }

        // 解析 container.xml 获取 OPF 文件路径
        const parser = new DOMParser();
        const containerDoc = parser.parseFromString(containerXml, 'application/xml');
        const rootfileEl = containerDoc.querySelector('rootfile');
        const opfPath = rootfileEl?.getAttribute('full-path');
        
        if (!opfPath) {
            throw new Error('无效的 EPUB 文件：找不到 OPF 文件路径');
        }

        this.opfPath = opfPath;
        this.opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1);

        // 读取并解析 OPF 文件
        const opfContent = await this.zip.file(opfPath)?.async('text');
        if (!opfContent) {
            throw new Error('无效的 EPUB 文件：找不到 OPF 文件');
        }

        const opfDoc = parser.parseFromString(opfContent, 'application/xml');

        // 获取元数据
        this.parseMetadata(opfDoc);

        // 获取 manifest（所有资源）
        await this.parseManifest(opfDoc);

        // 获取 spine（章节顺序）
        await this.parseSpine(opfDoc);
    }

    parseMetadata(opfDoc) {
        const metadataEl = opfDoc.querySelector('metadata');
        
        let title = metadataEl?.querySelector('title')?.textContent;
        if (!title) {
            title = metadataEl?.querySelector('dc\\:title, [*|title]')?.textContent;
        }
        
        let author = metadataEl?.querySelector('creator')?.textContent;
        if (!author) {
            author = metadataEl?.querySelector('dc\\:creator, [*|creator]')?.textContent;
        }

        this.metadata = {
            title: title || this.file.name.replace('.epub', ''),
            author: author || '未知作者'
        };
    }

    async parseManifest(opfDoc) {
        const manifestEl = opfDoc.querySelector('manifest');
        const items = manifestEl?.querySelectorAll('item') || [];

        this.manifest = new Map();

        for (const item of items) {
            const id = item.getAttribute('id');
            const href = decodeURIComponent(item.getAttribute('href'));
            const mediaType = item.getAttribute('media-type');
            const fullPath = this.opfDir + href;

            this.manifest.set(id, {
                id,
                href,
                fullPath,
                mediaType
            });
        }
    }

    async parseSpine(opfDoc) {
        const spineEl = opfDoc.querySelector('spine');
        const itemrefs = spineEl?.querySelectorAll('itemref') || [];

        this.chapters = [];

        for (let i = 0; i < itemrefs.length; i++) {
            const idref = itemrefs[i].getAttribute('idref');
            const manifestItem = this.manifest.get(idref);

            if (manifestItem) {
                const file = this.zip.file(manifestItem.fullPath);
                if (file) {
                    const content = await file.async('text');
                    const textContent = this.extractText(content);
                    const title = this.extractChapterTitle(content) || `第 ${i + 1} 章`;

                    this.chapters.push({
                        index: i + 1,
                        title,
                        text: textContent,
                        charCount: textContent.length
                    });
                }
            }
        }
    }

    extractChapterTitle(htmlContent) {
        if (!htmlContent) return null;
        
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'application/xhtml+xml');
            
            const titleEl = doc.querySelector('title');
            if (titleEl?.textContent?.trim()) {
                return titleEl.textContent.trim();
            }

            const h1 = doc.querySelector('h1, h2, h3');
            if (h1?.textContent?.trim()) {
                return h1.textContent.trim().substring(0, MAX_CHAPTER_TITLE_LENGTH);
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    extractText(htmlContent) {
        if (!htmlContent) return '';
        
        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'application/xhtml+xml');
            
            // 移除 script 和 style 标签
            const scripts = doc.querySelectorAll('script, style');
            scripts.forEach(el => el.remove());
            
            // 获取 body 的文本内容
            const body = doc.querySelector('body');
            if (!body) return '';
            
            // 获取文本并清理
            let text = body.textContent || '';
            
            // 清理多余的空白字符
            text = text.replace(/\n\s*\n/g, '\n\n'); // 多个换行变为两个
            text = text.replace(/[ \t]+/g, ' '); // 多个空格变为一个
            text = text.trim();
            
            return text;
        } catch (e) {
            console.error('提取文本失败:', e);
            return '';
        }
    }

    showPreview() {
        // 显示元数据
        this.bookTitle.textContent = this.metadata.title;
        this.bookAuthor.textContent = this.metadata.author;
        this.totalChapters.textContent = this.chapters.length + ' 章';

        // 显示章节列表
        this.chapterList.innerHTML = this.chapters.map((chapter) => {
            return `
                <div class="chapter-item">
                    <div class="chapter-info">
                        <span class="chapter-index">#${chapter.index}</span>
                        <span class="chapter-title">${chapter.title}</span>
                    </div>
                    <span class="chapter-chars">${chapter.charCount} 字</span>
                </div>
            `;
        }).join('');
    }

    async convert() {
        this.convertBtn.disabled = true;
        this.previewSection.hidden = true;
        this.progressSection.hidden = false;
        this.resultFiles = [];

        const outputFormat = this.outputFormat.value;
        const separator = this.chapterSeparator.value || '========================================';

        try {
            if (outputFormat === 'single') {
                // 单个文件模式
                this.updateProgress(50, '正在合并所有章节...');
                this.addLog('开始合并章节...', 'info');

                const allText = this.chapters.map(chapter => {
                    return `${chapter.title}\n\n${chapter.text}`;
                }).join(`\n\n${separator}\n\n`);

                const blob = new Blob([allText], { type: 'text/plain;charset=utf-8' });
                const fileName = `${this.metadata.title}.txt`;

                this.resultFiles.push({
                    name: fileName,
                    blob: blob,
                    size: blob.size
                });

                this.addLog(`✓ 完成 ${fileName} (${this.formatSize(blob.size)})`, 'success');
            } else {
                // 多个文件模式
                const total = this.chapters.length;
                
                for (let i = 0; i < this.chapters.length; i++) {
                    const chapter = this.chapters[i];
                    
                    this.updateProgress((i / total) * 100, `正在转换第 ${i + 1}/${total} 章...`);
                    this.addLog(`转换章节: ${chapter.title}`, 'info');

                    const text = `${chapter.title}\n\n${chapter.text}`;
                    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                    
                    // 清理文件名中的非法字符
                    const safeTitle = chapter.title.replace(/[<>:"/\\|?*]/g, '_');
                    const fileName = `${String(i + 1).padStart(3, '0')}_${safeTitle}.txt`;

                    this.resultFiles.push({
                        name: fileName,
                        blob: blob,
                        size: blob.size
                    });

                    this.addLog(`✓ 完成 ${fileName}`, 'success');
                }
            }

            this.updateProgress(100, '转换完成！');
            this.showResults();
        } catch (error) {
            console.error('转换失败:', error);
            this.addLog(`✗ 转换失败: ${error.message}`, 'error');
            alert('转换失败: ' + error.message);
        }
    }

    updateProgress(percent, text) {
        this.progressFill.style.width = percent + '%';
        this.progressText.textContent = text;
    }

    addLog(message, type = 'info') {
        const logItem = document.createElement('div');
        logItem.className = `log-item ${type}`;
        logItem.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.progressLog.appendChild(logItem);
        this.progressLog.scrollTop = this.progressLog.scrollHeight;
    }

    showResults() {
        this.progressSection.hidden = true;
        this.resultSection.hidden = false;
        
        this.resultCount.textContent = this.resultFiles.length;
        
        this.resultFilesEl.innerHTML = this.resultFiles.map((file, index) => `
            <div class="result-file">
                <div class="result-file-icon">📄</div>
                <div class="result-file-info">
                    <div class="result-file-name">${file.name}</div>
                    <div class="result-file-size">${this.formatSize(file.size)}</div>
                </div>
                <button class="btn btn-primary btn-download" onclick="converter.downloadFile(${index})">
                    📥 下载
                </button>
            </div>
        `).join('');
    }

    downloadFile(index) {
        const file = this.resultFiles[index];
        const url = URL.createObjectURL(file.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async downloadAll() {
        if (this.resultFiles.length === 1) {
            // 如果只有一个文件，直接下载
            this.downloadFile(0);
            return;
        }

        this.downloadAllBtn.disabled = true;
        this.downloadAllBtn.innerHTML = '<span class="btn-icon">⏳</span> 打包中...';

        try {
            const zip = new JSZip();
            
            for (const file of this.resultFiles) {
                zip.file(file.name, file.blob);
            }

            const blob = await zip.generateAsync({
                type: 'blob',
                compression: 'DEFLATE',
                compressionOptions: { level: DEFAULT_COMPRESSION_LEVEL }
            });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${this.metadata.title}_txt.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('打包失败:', error);
            alert('打包失败: ' + error.message);
        } finally {
            this.downloadAllBtn.disabled = false;
            this.downloadAllBtn.innerHTML = '<span class="btn-icon">📥</span> 下载全部';
        }
    }

    reset() {
        this.file = null;
        this.zip = null;
        this.metadata = {};
        this.manifest = new Map();
        this.chapters = [];
        this.resultFiles = [];

        this.fileInput.value = '';
        this.uploadArea.hidden = false;
        this.fileInfo.hidden = true;
        this.settingsSection.hidden = true;
        this.previewSection.hidden = true;
        this.progressSection.hidden = true;
        this.resultSection.hidden = true;
        this.progressLog.innerHTML = '';
        this.convertBtn.disabled = false;
    }
}

// 初始化应用
const converter = new EPUBToTxtConverter();

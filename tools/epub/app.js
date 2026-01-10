/**
 * EPUB 拆分工具
 * 将大型 EPUB 文件按章节拆分为多个小文件
 * 关键：追踪每个章节引用的资源，按累积大小拆分
 */

class EPUBSplitter {
    constructor() {
        this.file = null;
        this.zip = null;
        this.metadata = {};
        this.manifest = new Map();
        this.chapters = [];
        this.splitPlan = [];
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
        this.targetSize = document.getElementById('targetSize');
        this.outputPrefix = document.getElementById('outputPrefix');
        this.analyzeBtn = document.getElementById('analyzeBtn');

        // Preview elements
        this.previewSection = document.getElementById('previewSection');
        this.bookTitle = document.getElementById('bookTitle');
        this.bookAuthor = document.getElementById('bookAuthor');
        this.totalChapters = document.getElementById('totalChapters');
        this.splitCount = document.getElementById('splitCount');
        this.splitList = document.getElementById('splitList');
        this.chapterList = document.getElementById('chapterList');
        this.splitBtn = document.getElementById('splitBtn');

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
        this.analyzeBtn.addEventListener('click', () => this.analyzeEPUB());
        this.splitBtn.addEventListener('click', () => this.splitEPUB());
        this.downloadAllBtn.addEventListener('click', () => this.downloadAll());
        this.resetBtn.addEventListener('click', () => this.reset());
    }

    handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.loadFile(files[0]);
        }
    }

    loadFile(file) {
        this.file = file;
        this.fileName.textContent = file.name;
        this.fileSize.textContent = this.formatSize(file.size);
        this.uploadArea.hidden = true;
        this.fileInfo.hidden = false;
        this.settingsSection.hidden = false;
        this.outputPrefix.placeholder = file.name.replace('.epub', '');
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

    async analyzeEPUB() {
        this.analyzeBtn.disabled = true;
        this.analyzeBtn.innerHTML = '<span class="btn-icon">⏳</span> 分析中...';

        try {
            // 读取 EPUB 文件
            const arrayBuffer = await this.file.arrayBuffer();
            this.zip = await JSZip.loadAsync(arrayBuffer);

            // 解析 EPUB 结构
            await this.parseEPUBStructure();

            // 解析每个章节引用的资源
            await this.parseChapterResources();

            // 计算拆分计划
            this.calculateSplitPlan();

            // 显示预览
            this.showPreview();

            this.previewSection.hidden = false;
        } catch (error) {
            console.error('分析 EPUB 失败:', error);
            alert('分析 EPUB 文件失败: ' + error.message);
        } finally {
            this.analyzeBtn.disabled = false;
            this.analyzeBtn.innerHTML = '<span class="btn-icon">🔍</span> 分析 EPUB 结构';
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
        this.parseSpine(opfDoc);
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
            author: author || '未知作者',
            identifier: metadataEl?.querySelector('identifier')?.textContent || Date.now().toString(),
            language: metadataEl?.querySelector('language')?.textContent || 'zh-CN'
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

            const file = this.zip.file(fullPath);
            let size = 0;
            let content = null;

            if (file) {
                const data = await file.async('arraybuffer');
                size = data.byteLength;
                content = data;
            }

            const isContent = mediaType?.includes('xhtml') || mediaType?.includes('xml');

            this.manifest.set(id, {
                id,
                href,
                fullPath,
                mediaType,
                size,
                content,
                isContent
            });
        }
    }

    parseSpine(opfDoc) {
        const spineEl = opfDoc.querySelector('spine');
        const itemrefs = spineEl?.querySelectorAll('itemref') || [];

        this.chapters = [];

        for (let i = 0; i < itemrefs.length; i++) {
            const idref = itemrefs[i].getAttribute('idref');
            const manifestItem = this.manifest.get(idref);

            if (manifestItem) {
                this.chapters.push({
                    index: i + 1,
                    id: idref,
                    href: manifestItem.href,
                    fullPath: manifestItem.fullPath,
                    mediaType: manifestItem.mediaType,
                    size: manifestItem.size,
                    content: manifestItem.content,
                    title: this.extractChapterTitle(manifestItem.content) || `第 ${i + 1} 章`,
                    usedResources: new Set() // 将在 parseChapterResources 中填充
                });
            }
        }
    }

    extractChapterTitle(content) {
        if (!content) return null;
        
        try {
            const text = new TextDecoder().decode(content);
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'application/xhtml+xml');
            
            const titleEl = doc.querySelector('title');
            if (titleEl?.textContent?.trim()) {
                return titleEl.textContent.trim();
            }

            const h1 = doc.querySelector('h1, h2, h3');
            if (h1?.textContent?.trim()) {
                return h1.textContent.trim().substring(0, 50);
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    async parseChapterResources() {
        // 为每个章节解析引用的资源
        for (const chapter of this.chapters) {
            if (chapter.content) {
                const text = new TextDecoder().decode(chapter.content);
                const chapterDir = chapter.href.substring(0, chapter.href.lastIndexOf('/') + 1);
                
                // 找所有资源引用
                const patterns = [
                    /src=["']([^"']+)["']/gi,
                    /href=["']([^"'#]+\.(?:css|jpg|jpeg|png|gif|svg|ttf|otf|woff|woff2|webp))["']/gi,
                    /url\(["']?([^"')]+)["']?\)/gi
                ];
                
                for (const pattern of patterns) {
                    let match;
                    while ((match = pattern.exec(text)) !== null) {
                        let ref = match[1];
                        if (ref.startsWith('http') || ref.startsWith('data:')) continue;
                        
                        // 规范化路径
                        let resourceHref = this.resolveRelativePath(chapterDir, ref);
                        
                        // 在 manifest 中查找
                        for (const [id, item] of this.manifest) {
                            if (item.href === resourceHref || 
                                item.href.endsWith('/' + resourceHref) || 
                                resourceHref.endsWith(item.href) ||
                                item.href === ref) {
                                chapter.usedResources.add(id);
                                break;
                            }
                        }
                    }
                }
            }
        }
    }

    resolveRelativePath(basePath, relativePath) {
        if (relativePath.startsWith('/')) {
            return relativePath.substring(1);
        }
        
        const baseParts = basePath.split('/').filter(p => p);
        const relParts = relativePath.split('/');
        
        for (const part of relParts) {
            if (part === '..') {
                baseParts.pop();
            } else if (part !== '.' && part !== '') {
                baseParts.push(part);
            }
        }
        
        return baseParts.join('/');
    }

    calculateSplitPlan() {
        const targetBytes = this.targetSize.value * 1024 * 1024;

        this.splitPlan = [];
        let currentGroup = [];
        let currentResources = new Set(); // 当前组已包含的资源
        let currentTotalSize = 0; // 当前组的总大小（章节+资源）

        for (const chapter of this.chapters) {
            // 计算如果加入此章节，会新增多少大小
            let newChapterSize = chapter.size;
            let newResourcesSize = 0;
            
            for (const resId of chapter.usedResources) {
                if (!currentResources.has(resId)) {
                    const res = this.manifest.get(resId);
                    if (res && !res.isContent) {
                        newResourcesSize += res.size;
                    }
                }
            }
            
            const additionalSize = newChapterSize + newResourcesSize;
            const projectedSize = currentTotalSize + additionalSize;
            
            // 如果加入会超过目标，并且当前组不为空，先保存当前组
            if (projectedSize > targetBytes && currentGroup.length > 0) {
                this.splitPlan.push({
                    chapters: [...currentGroup],
                    resources: new Set(currentResources),
                    totalSize: currentTotalSize
                });
                
                // 重置当前组
                currentGroup = [];
                currentResources = new Set();
                currentTotalSize = 0;
                
                // 重新计算此章节的资源（因为新组没有任何资源）
                newResourcesSize = 0;
                for (const resId of chapter.usedResources) {
                    const res = this.manifest.get(resId);
                    if (res && !res.isContent) {
                        newResourcesSize += res.size;
                    }
                }
            }
            
            // 加入此章节
            currentGroup.push(chapter);
            currentTotalSize += chapter.size;
            
            for (const resId of chapter.usedResources) {
                if (!currentResources.has(resId)) {
                    const res = this.manifest.get(resId);
                    if (res && !res.isContent) {
                        currentResources.add(resId);
                        currentTotalSize += res.size;
                    }
                }
            }
        }
        
        // 添加最后一组
        if (currentGroup.length > 0) {
            this.splitPlan.push({
                chapters: [...currentGroup],
                resources: new Set(currentResources),
                totalSize: currentTotalSize
            });
        }
    }

    showPreview() {
        // 显示元数据
        this.bookTitle.textContent = this.metadata.title;
        this.bookAuthor.textContent = this.metadata.author;
        this.totalChapters.textContent = this.chapters.length + ' 章';
        this.splitCount.textContent = this.splitPlan.length + ' 个文件';

        // 显示拆分预览
        const prefix = this.outputPrefix.value || this.file.name.replace('.epub', '');
        this.splitList.innerHTML = this.splitPlan.map((split, index) => {
            const isOversized = split.totalSize > this.targetSize.value * 1024 * 1024;
            return `
                <div class="split-item${isOversized ? ' oversized' : ''}">
                    <div class="split-number">${index + 1}</div>
                    <div class="split-details">
                        <div class="split-name">${prefix}_part${index + 1}.epub</div>
                        <div class="split-chapters">
                            章节 ${split.chapters[0].index} - ${split.chapters[split.chapters.length - 1].index}
                            (共 ${split.chapters.length} 章, ${split.resources.size} 个资源)
                            ${isOversized ? ' ⚠️ 单章节超大' : ''}
                        </div>
                    </div>
                    <div class="split-size">≤ ${this.formatSize(split.totalSize)}</div>
                </div>
            `;
        }).join('');

        // 显示章节列表
        this.chapterList.innerHTML = this.chapters.map((chapter) => {
            let splitIndex = this.splitPlan.findIndex(split => 
                split.chapters.some(c => c.index === chapter.index)
            );
            
            return `
                <div class="chapter-item">
                    <div class="chapter-info">
                        <span class="chapter-index">#${chapter.index}</span>
                        <span class="chapter-title">${chapter.title}</span>
                    </div>
                    <span class="chapter-size">${this.formatSize(chapter.size)} (${chapter.usedResources.size}资源)</span>
                    <span class="chapter-split-tag">Part ${splitIndex + 1}</span>
                </div>
            `;
        }).join('');
    }

    async splitEPUB() {
        this.splitBtn.disabled = true;
        this.previewSection.hidden = true;
        this.progressSection.hidden = false;
        this.resultFiles = [];

        const prefix = this.outputPrefix.value || this.file.name.replace('.epub', '');
        const total = this.splitPlan.length;

        try {
            for (let i = 0; i < this.splitPlan.length; i++) {
                const split = this.splitPlan[i];
                const partNum = i + 1;
                
                this.updateProgress((i / total) * 100, `正在创建第 ${partNum}/${total} 个文件...`);
                this.addLog(`开始创建 ${prefix}_part${partNum}.epub`, 'info');

                const epubBlob = await this.createSplitEPUB(split, prefix, partNum);
                
                this.resultFiles.push({
                    name: `${prefix}_part${partNum}.epub`,
                    blob: epubBlob,
                    size: epubBlob.size
                });

                this.addLog(`✓ 完成 ${prefix}_part${partNum}.epub (${this.formatSize(epubBlob.size)})`, 'success');
            }

            this.updateProgress(100, '拆分完成！');
            this.showResults();
        } catch (error) {
            console.error('拆分失败:', error);
            this.addLog(`✗ 拆分失败: ${error.message}`, 'error');
            alert('拆分失败: ' + error.message);
        }
    }

    async createSplitEPUB(split, prefix, partNum) {
        const newZip = new JSZip();

        // 1. 添加 mimetype
        newZip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

        // 2. 添加 META-INF/container.xml
        newZip.file('META-INF/container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`);

        // 3. 添加章节文件
        for (const chapter of split.chapters) {
            if (chapter.content) {
                newZip.file('OEBPS/' + chapter.href, chapter.content);
            }
        }

        // 4. 添加资源文件
        for (const resId of split.resources) {
            const res = this.manifest.get(resId);
            if (res && res.content) {
                newZip.file('OEBPS/' + res.href, res.content);
            }
        }

        // 5. 创建 content.opf
        const manifestItems = ['<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>'];
        const spineItems = [];
        
        for (const chapter of split.chapters) {
            manifestItems.push(`<item id="${chapter.id}" href="${this.escapeXml(chapter.href)}" media-type="${chapter.mediaType}"/>`);
            spineItems.push(`<itemref idref="${chapter.id}"/>`);
        }
        
        for (const resId of split.resources) {
            const res = this.manifest.get(resId);
            if (res) {
                manifestItems.push(`<item id="${res.id}" href="${this.escapeXml(res.href)}" media-type="${res.mediaType}"/>`);
            }
        }

        const opfContent = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:title>${this.escapeXml(this.metadata.title)} (Part ${partNum}/${this.splitPlan.length})</dc:title>
        <dc:creator>${this.escapeXml(this.metadata.author)}</dc:creator>
        <dc:identifier id="BookId">${this.metadata.identifier}_part${partNum}</dc:identifier>
        <dc:language>${this.metadata.language}</dc:language>
    </metadata>
    <manifest>
        ${manifestItems.join('\n        ')}
    </manifest>
    <spine toc="ncx">
        ${spineItems.join('\n        ')}
    </spine>
</package>`;

        newZip.file('OEBPS/content.opf', opfContent);

        // 6. 创建 NCX 导航文件
        const navPoints = split.chapters.map((chapter, index) => `
        <navPoint id="navPoint-${index + 1}" playOrder="${index + 1}">
            <navLabel>
                <text>${this.escapeXml(chapter.title)}</text>
            </navLabel>
            <content src="${this.escapeXml(chapter.href)}"/>
        </navPoint>`).join('');

        const ncxContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
    <head>
        <meta name="dtb:uid" content="${this.metadata.identifier}_part${partNum}"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
    </head>
    <docTitle>
        <text>${this.escapeXml(this.metadata.title)} (Part ${partNum})</text>
    </docTitle>
    <navMap>${navPoints}
    </navMap>
</ncx>`;

        newZip.file('OEBPS/toc.ncx', ncxContent);

        // 7. 生成 EPUB
        const blob = await newZip.generateAsync({
            type: 'blob',
            mimeType: 'application/epub+zip',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        return blob;
    }

    escapeXml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
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
        
        document.getElementById('resultCount').textContent = this.resultFiles.length;
        
        this.resultFilesEl.innerHTML = this.resultFiles.map((file, index) => `
            <div class="result-file">
                <div class="result-file-icon">📕</div>
                <div class="result-file-info">
                    <div class="result-file-name">${file.name}</div>
                    <div class="result-file-size">${this.formatSize(file.size)}</div>
                </div>
                <button class="btn btn-primary btn-download" onclick="splitter.downloadFile(${index})">
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
                compressionOptions: { level: 6 }
            });

            const prefix = this.outputPrefix.value || this.file.name.replace('.epub', '');
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${prefix}_split.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('打包失败:', error);
            alert('打包失败: ' + error.message);
        } finally {
            this.downloadAllBtn.disabled = false;
            this.downloadAllBtn.innerHTML = '<span class="btn-icon">📥</span> 下载全部 (ZIP)';
        }
    }

    reset() {
        this.file = null;
        this.zip = null;
        this.metadata = {};
        this.manifest = new Map();
        this.chapters = [];
        this.splitPlan = [];
        this.resultFiles = [];

        this.fileInput.value = '';
        this.uploadArea.hidden = false;
        this.fileInfo.hidden = true;
        this.settingsSection.hidden = true;
        this.previewSection.hidden = true;
        this.progressSection.hidden = true;
        this.resultSection.hidden = true;
        this.progressLog.innerHTML = '';
        this.splitBtn.disabled = false;
    }
}

// 初始化应用
const splitter = new EPUBSplitter();

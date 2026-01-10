/**
 * EPUB 拆分工具
 * 将大型 EPUB 文件按章节拆分为多个小文件
 */

class EPUBSplitter {
    constructor() {
        this.file = null;
        this.zip = null;
        this.metadata = {};
        this.chapters = [];
        this.resources = new Map(); // 资源文件映射
        this.splitPlan = [];
        this.resultFiles = [];
        
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
        this.resultFiles = document.getElementById('resultFiles');
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
        this.opfDoc = opfDoc;

        // 获取元数据
        this.parseMetadata(opfDoc);

        // 获取 manifest（所有资源）
        await this.parseManifest(opfDoc);

        // 获取 spine（章节顺序）
        this.parseSpine(opfDoc);
    }

    parseMetadata(opfDoc) {
        const metadataEl = opfDoc.querySelector('metadata');
        
        // 尝试多种方式获取标题
        let title = metadataEl?.querySelector('title')?.textContent;
        if (!title) {
            title = metadataEl?.querySelector('dc\\:title, [*|title]')?.textContent;
        }
        
        // 尝试多种方式获取作者
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
        this.resources = new Map();

        for (const item of items) {
            const id = item.getAttribute('id');
            const href = item.getAttribute('href');
            const mediaType = item.getAttribute('media-type');

            // 解码 URL 编码的路径
            const decodedHref = decodeURIComponent(href);
            const fullPath = this.opfDir + decodedHref;

            // 获取文件内容和大小
            const file = this.zip.file(fullPath);
            let size = 0;
            let content = null;

            if (file) {
                const data = await file.async('arraybuffer');
                size = data.byteLength;
                content = data;
            }

            this.manifest.set(id, {
                id,
                href: decodedHref,
                fullPath,
                mediaType,
                size,
                content
            });

            // 非 spine 项目作为资源
            if (!mediaType?.includes('xhtml') && !mediaType?.includes('xml')) {
                this.resources.set(fullPath, {
                    href: decodedHref,
                    fullPath,
                    mediaType,
                    size,
                    content
                });
            }
        }
    }

    parseSpine(opfDoc) {
        const spineEl = opfDoc.querySelector('spine');
        const itemrefs = spineEl?.querySelectorAll('itemref') || [];

        this.chapters = [];
        let index = 0;

        for (const itemref of itemrefs) {
            const idref = itemref.getAttribute('idref');
            const manifestItem = this.manifest.get(idref);

            if (manifestItem) {
                index++;
                this.chapters.push({
                    index,
                    id: idref,
                    href: manifestItem.href,
                    fullPath: manifestItem.fullPath,
                    mediaType: manifestItem.mediaType,
                    size: manifestItem.size,
                    content: manifestItem.content,
                    title: this.extractChapterTitle(manifestItem.content) || `第 ${index} 章`
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
            
            // 尝试从 title 标签获取
            const titleEl = doc.querySelector('title');
            if (titleEl?.textContent?.trim()) {
                return titleEl.textContent.trim();
            }

            // 尝试从 h1, h2 标签获取
            const h1 = doc.querySelector('h1, h2, h3');
            if (h1?.textContent?.trim()) {
                return h1.textContent.trim().substring(0, 50);
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    calculateSplitPlan() {
        const targetBytes = this.targetSize.value * 1024 * 1024;
        
        // 计算共享资源的大小（如样式、字体、封面等）
        let sharedResourcesSize = 0;
        for (const resource of this.resources.values()) {
            sharedResourcesSize += resource.size;
        }

        // 计算每个分卷的有效目标大小（扣除共享资源）
        const effectiveTargetSize = Math.max(targetBytes - sharedResourcesSize, targetBytes * 0.5);

        this.splitPlan = [];
        let currentGroup = [];
        let currentSize = 0;

        for (const chapter of this.chapters) {
            // 检查资源引用并计算章节真实大小
            const chapterResources = this.findChapterResources(chapter);
            let chapterTotalSize = chapter.size;
            
            // 如果加入当前章节会超过目标大小，并且当前组不为空，则开始新组
            if (currentSize + chapterTotalSize > effectiveTargetSize && currentGroup.length > 0) {
                this.splitPlan.push({
                    chapters: [...currentGroup],
                    size: currentSize + sharedResourcesSize,
                    resources: chapterResources
                });
                currentGroup = [];
                currentSize = 0;
            }

            currentGroup.push(chapter);
            currentSize += chapterTotalSize;
        }

        // 添加最后一组
        if (currentGroup.length > 0) {
            this.splitPlan.push({
                chapters: [...currentGroup],
                size: currentSize + sharedResourcesSize,
                resources: this.findChapterResources(currentGroup[currentGroup.length - 1])
            });
        }
    }

    findChapterResources(chapter) {
        // 这里可以解析章节内容，找出引用的资源
        // 简化处理：返回所有共享资源
        return new Map(this.resources);
    }

    showPreview() {
        // 显示元数据
        this.bookTitle.textContent = this.metadata.title;
        this.bookAuthor.textContent = this.metadata.author;
        this.totalChapters.textContent = this.chapters.length + ' 章';
        this.splitCount.textContent = this.splitPlan.length + ' 个文件';

        // 显示拆分预览
        const prefix = this.outputPrefix.value || this.file.name.replace('.epub', '');
        this.splitList.innerHTML = this.splitPlan.map((split, index) => `
            <div class="split-item">
                <div class="split-number">${index + 1}</div>
                <div class="split-details">
                    <div class="split-name">${prefix}_part${index + 1}.epub</div>
                    <div class="split-chapters">
                        章节 ${split.chapters[0].index} - ${split.chapters[split.chapters.length - 1].index}
                        (共 ${split.chapters.length} 章)
                    </div>
                </div>
                <div class="split-size">${this.formatSize(split.size)}</div>
            </div>
        `).join('');

        // 显示章节列表
        this.chapterList.innerHTML = this.chapters.map((chapter, idx) => {
            // 找出该章节属于哪个分卷
            let splitIndex = this.splitPlan.findIndex(split => 
                split.chapters.some(c => c.index === chapter.index)
            );
            
            return `
                <div class="chapter-item">
                    <div class="chapter-info">
                        <span class="chapter-index">#${chapter.index}</span>
                        <span class="chapter-title">${chapter.title}</span>
                    </div>
                    <span class="chapter-size">${this.formatSize(chapter.size)}</span>
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

        // 1. 添加 mimetype（必须是第一个文件，且不压缩）
        newZip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

        // 2. 添加 META-INF/container.xml
        const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
        <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
</container>`;
        newZip.file('META-INF/container.xml', containerXml);

        // 3. 收集需要的资源
        const includedResources = new Set();
        
        // 添加章节内容和解析其引用的资源
        for (const chapter of split.chapters) {
            if (chapter.content) {
                const content = new TextDecoder().decode(chapter.content);
                // 解析引用的资源
                this.findResourcesInContent(content, chapter.href, includedResources);
            }
        }

        // 4. 创建新的 content.opf
        const opfContent = this.createOPF(split.chapters, includedResources, prefix, partNum);
        newZip.file('OEBPS/content.opf', opfContent);

        // 5. 添加章节文件
        for (const chapter of split.chapters) {
            if (chapter.content) {
                newZip.file('OEBPS/' + chapter.href, chapter.content);
            }
        }

        // 6. 添加必要的资源文件（CSS、图片、字体等）
        for (const resourcePath of includedResources) {
            const resource = this.resources.get(resourcePath);
            if (resource && resource.content) {
                newZip.file('OEBPS/' + resource.href, resource.content);
            } else {
                // 尝试从原始 manifest 获取
                for (const [id, item] of this.manifest) {
                    if (item.fullPath === resourcePath && item.content) {
                        newZip.file('OEBPS/' + item.href, item.content);
                        break;
                    }
                }
            }
        }

        // 7. 创建 NCX 导航文件
        const ncxContent = this.createNCX(split.chapters, prefix, partNum);
        newZip.file('OEBPS/toc.ncx', ncxContent);

        // 8. 生成 EPUB
        const blob = await newZip.generateAsync({
            type: 'blob',
            mimeType: 'application/epub+zip',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });

        return blob;
    }

    findResourcesInContent(content, chapterHref, includedResources) {
        // 获取章节所在目录
        const chapterDir = chapterHref.substring(0, chapterHref.lastIndexOf('/') + 1);
        
        // 查找 src, href, url() 引用
        const patterns = [
            /src=["']([^"']+)["']/gi,
            /href=["']([^"'#]+)["']/gi,
            /url\(["']?([^"')]+)["']?\)/gi
        ];

        for (const pattern of patterns) {
            let match;
            while ((match = pattern.exec(content)) !== null) {
                let resourcePath = match[1];
                
                // 跳过外部链接和数据 URI
                if (resourcePath.startsWith('http') || resourcePath.startsWith('data:')) {
                    continue;
                }

                // 解析相对路径
                if (resourcePath.startsWith('../')) {
                    resourcePath = this.resolveRelativePath(chapterDir, resourcePath);
                } else if (!resourcePath.startsWith('/')) {
                    resourcePath = chapterDir + resourcePath;
                }

                // 规范化路径
                resourcePath = this.normalizePath(this.opfDir + resourcePath);
                
                // 添加到资源集合
                if (this.resources.has(resourcePath) || this.manifest.has(resourcePath)) {
                    includedResources.add(resourcePath);
                }
                
                // 同时检查不带目录前缀的路径
                for (const [id, item] of this.manifest) {
                    if (item.fullPath === resourcePath || 
                        item.href === match[1] ||
                        item.fullPath.endsWith(match[1])) {
                        includedResources.add(item.fullPath);
                    }
                }
            }
        }

        // 确保包含所有 CSS 文件（它们可能引用其他资源）
        for (const [id, item] of this.manifest) {
            if (item.mediaType === 'text/css' || item.href.endsWith('.css')) {
                includedResources.add(item.fullPath);
            }
        }
    }

    resolveRelativePath(basePath, relativePath) {
        const parts = basePath.split('/').filter(p => p);
        const relParts = relativePath.split('/');

        for (const part of relParts) {
            if (part === '..') {
                parts.pop();
            } else if (part !== '.') {
                parts.push(part);
            }
        }

        return parts.join('/');
    }

    normalizePath(path) {
        const parts = path.split('/');
        const result = [];

        for (const part of parts) {
            if (part === '..') {
                result.pop();
            } else if (part !== '.' && part !== '') {
                result.push(part);
            }
        }

        return result.join('/');
    }

    createOPF(chapters, includedResources, prefix, partNum) {
        const manifestItems = [];
        const spineItems = [];

        // 添加 NCX
        manifestItems.push(`<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`);

        // 添加章节
        for (const chapter of chapters) {
            manifestItems.push(`<item id="${chapter.id}" href="${this.escapeXml(chapter.href)}" media-type="${chapter.mediaType}"/>`);
            spineItems.push(`<itemref idref="${chapter.id}"/>`);
        }

        // 添加资源
        let resourceIndex = 0;
        const addedHrefs = new Set(chapters.map(c => c.href));
        
        for (const resourcePath of includedResources) {
            let resource = this.resources.get(resourcePath);
            if (!resource) {
                for (const [id, item] of this.manifest) {
                    if (item.fullPath === resourcePath) {
                        resource = item;
                        break;
                    }
                }
            }
            
            if (resource && !addedHrefs.has(resource.href)) {
                const resourceId = `resource_${resourceIndex++}`;
                manifestItems.push(`<item id="${resourceId}" href="${this.escapeXml(resource.href)}" media-type="${resource.mediaType}"/>`);
                addedHrefs.add(resource.href);
            }
        }

        return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
    <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
        <dc:title>${this.escapeXml(this.metadata.title)} (Part ${partNum})</dc:title>
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
    }

    createNCX(chapters, prefix, partNum) {
        const navPoints = chapters.map((chapter, index) => `
        <navPoint id="navPoint-${index + 1}" playOrder="${index + 1}">
            <navLabel>
                <text>${this.escapeXml(chapter.title)}</text>
            </navLabel>
            <content src="${this.escapeXml(chapter.href)}"/>
        </navPoint>`).join('');

        return `<?xml version="1.0" encoding="UTF-8"?>
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
        
        const resultFilesEl = document.getElementById('resultFiles');
        resultFilesEl.innerHTML = this.resultFiles.map((file, index) => `
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
        this.chapters = [];
        this.resources = new Map();
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

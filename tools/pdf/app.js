// PDF to EPUB Converter
// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

class PDFToEPUBConverter {
    constructor() {
        this.pdfFile = null;
        this.pdfDocument = null;
        this.extractedContent = {
            pages: [],
            images: [],
            chapters: [],
            metadata: {}
        };
        this.epubBlob = null;
        
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

        // Sections
        this.uploadSection = document.getElementById('uploadSection');
        this.settingsSection = document.getElementById('settingsSection');
        this.progressSection = document.getElementById('progressSection');
        this.previewSection = document.getElementById('previewSection');
        this.completeSection = document.getElementById('completeSection');

        // Settings
        this.bookTitle = document.getElementById('bookTitle');
        this.bookAuthor = document.getElementById('bookAuthor');
        this.bookLanguage = document.getElementById('bookLanguage');
        this.bookPublisher = document.getElementById('bookPublisher');
        this.bookDescription = document.getElementById('bookDescription');
        this.extractImages = document.getElementById('extractImages');
        this.preserveLinks = document.getElementById('preserveLinks');
        this.generateToc = document.getElementById('generateToc');
        this.splitChapters = document.getElementById('splitChapters');
        this.smartParagraph = document.getElementById('smartParagraph');
        this.fontSize = document.getElementById('fontSize');
        this.chapterPattern = document.getElementById('chapterPattern');
        this.customChapters = document.getElementById('customChapters');

        // Buttons
        this.previewBtn = document.getElementById('previewBtn');
        this.convertBtn = document.getElementById('convertBtn');
        this.closePreviewBtn = document.getElementById('closePreviewBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.convertAnotherBtn = document.getElementById('convertAnotherBtn');

        // Progress elements
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.progressStatus = document.getElementById('progressStatus');
        this.progressDetails = document.getElementById('progressDetails');

        // Preview
        this.previewContent = document.getElementById('previewContent');

        // Result
        this.resultFileName = document.getElementById('resultFileName');
        this.resultFileSize = document.getElementById('resultFileSize');
        this.resultChapters = document.getElementById('resultChapters');
        this.resultImages = document.getElementById('resultImages');

        // Toast
        this.toast = document.getElementById('toast');
        this.toastIcon = document.getElementById('toastIcon');
        this.toastMessage = document.getElementById('toastMessage');
    }

    bindEvents() {
        // File upload events
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
            if (files.length > 0 && files[0].type === 'application/pdf') {
                this.loadFile(files[0]);
            } else {
                this.showToast('请选择 PDF 文件', 'error');
            }
        });

        // Button events
        this.previewBtn.addEventListener('click', () => this.previewContent_());
        this.convertBtn.addEventListener('click', () => this.startConversion());
        this.closePreviewBtn.addEventListener('click', () => this.closePreview());
        this.downloadBtn.addEventListener('click', () => this.downloadEPUB());
        this.convertAnotherBtn.addEventListener('click', () => this.reset());
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.type === 'application/pdf') {
                this.loadFile(file);
            } else {
                this.showToast('请选择 PDF 文件', 'error');
            }
        }
    }

    async loadFile(file) {
        this.pdfFile = file;
        this.fileName.textContent = file.name;
        this.fileSize.textContent = this.formatFileSize(file.size);
        
        // Show file info and hide upload area
        this.uploadArea.hidden = true;
        this.fileInfo.hidden = false;

        // Set default title from filename
        const defaultTitle = file.name.replace(/\.pdf$/i, '');
        this.bookTitle.value = defaultTitle;

        try {
            // Load PDF document
            const arrayBuffer = await file.arrayBuffer();
            this.pdfDocument = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            
            // Try to get PDF metadata
            const metadata = await this.pdfDocument.getMetadata();
            if (metadata.info) {
                if (metadata.info.Title) this.bookTitle.value = metadata.info.Title;
                if (metadata.info.Author) this.bookAuthor.value = metadata.info.Author;
            }

            // Show settings section
            this.settingsSection.hidden = false;
            this.showToast(`已加载 PDF，共 ${this.pdfDocument.numPages} 页`, 'success');
        } catch (error) {
            console.error('Error loading PDF:', error);
            this.showToast('加载 PDF 失败，请检查文件是否损坏', 'error');
            this.removeFile();
        }
    }

    removeFile() {
        this.pdfFile = null;
        this.pdfDocument = null;
        this.fileInput.value = '';
        this.uploadArea.hidden = false;
        this.fileInfo.hidden = true;
        this.settingsSection.hidden = true;
        this.extractedContent = { pages: [], images: [], chapters: [], metadata: {} };
    }

    async previewContent_() {
        if (!this.pdfDocument) {
            this.showToast('请先加载 PDF 文件', 'error');
            return;
        }

        this.previewBtn.disabled = true;
        this.previewBtn.textContent = '正在提取...';

        try {
            // 提取全部内容用于章节预览
            await this.extractPDFContent();
            // 处理章节分割
            await this.processChaptersForPreview();
            this.displayPreview();
            this.previewSection.hidden = false;
        } catch (error) {
            console.error('Preview error:', error);
            this.showToast('预览失败：' + error.message, 'error');
        } finally {
            this.previewBtn.disabled = false;
            this.previewBtn.textContent = '预览内容';
        }
    }
    
    /**
     * 用于预览的章节处理（与 processChapters 相同逻辑，但不添加进度信息）
     */
    async processChaptersForPreview() {
        // Merge all pages and apply cross-page paragraph merging
        let allText = this.extractedContent.pages.map(p => p.text).join('\n\n');
        
        // Apply additional smart paragraph cleanup if enabled
        if (this.smartParagraph.checked) {
            allText = this.cleanupParagraphs(allText);
        }
        
        const pattern = this.chapterPattern.value;
        
        let chapterRegex;
        switch (pattern) {
            case 'chinese':
                // 匹配"第X章/节/回"
                chapterRegex = /^(第\s*[一二三四五六七八九十百千\d]+\s*[章节回部篇卷集].*?)$/gm;
                break;
            case 'english':
                chapterRegex = /^(Chapter\s+\d+.*?)$/gim;
                break;
            case 'number':
                chapterRegex = /^(\d+\.\s+.*?)$/gm;
                break;
            case 'padded':
                // 匹配两位数字开头的行，如 01 02 03 或 01- 02- 03-
                chapterRegex = /^(\d{2}[\s\-－].*)$/gm;
                break;
            default: // auto
                // 自动识别多种章节格式
                chapterRegex = /^(第\s*[一二三四五六七八九十百千\d]+\s*[章节回部篇卷集].*?|Chapter\s+\d+.*?|\d+\.\s+.{2,50}|\d{2}[\s\-－].{2,50})$/gim;
        }
        
        // 过滤掉分页信息（如"第1页"、"第 1-5 页"、"Page 1"等）
        const pageInfoPattern = /^(第\s*[\d\-\s~～]+\s*页|Page\s*[\d\-\s~]+|[\d\-~～]+\s*页|\d+\s*[-~～]\s*\d+)$/i;
        
        // 检查是否是分页信息的函数
        const isPageInfo = (title) => {
            // 匹配各种分页格式
            if (pageInfoPattern.test(title)) return true;
            // 检查是否包含"页"字且是分页格式
            if (/页\s*$/.test(title) && /[\d\-~～]/.test(title)) return true;
            // 检查"第...X...页"格式（包含数字和"页"）
            if (/^第.*页\s*$/.test(title) && /\d/.test(title)) return true;
            return false;
        };

        if (this.splitChapters.checked) {
            const matches = [...allText.matchAll(chapterRegex)];
            
            // 过滤掉分页信息
            const filteredMatches = matches.filter(match => {
                const title = match[1].trim();
                return !isPageInfo(title);
            });
            
            // 合并自定义章节标题匹配
            const customMatches = this.getCustomChapterMatches(allText);
            const allMatches = [...filteredMatches, ...customMatches];
            
            // 按位置排序并去重
            allMatches.sort((a, b) => a.index - b.index);
            const uniqueMatches = this.deduplicateMatches(allMatches);
            
            if (uniqueMatches.length > 0) {
                this.extractedContent.chapters = [];
                
                // 检查第一个章节之前是否有内容，如果有则作为“前言”
                const firstMatchIndex = uniqueMatches[0].index;
                if (firstMatchIndex > 0) {
                    const prefaceContent = allText.substring(0, firstMatchIndex).trim();
                    // 只有当前言内容超过100个字符时才添加
                    if (prefaceContent.length > 100) {
                        this.extractedContent.chapters.push({
                            title: '前言',
                            content: prefaceContent,
                            id: 'chapter_preface'
                        });
                    }
                }
                
                for (let i = 0; i < uniqueMatches.length; i++) {
                    const match = uniqueMatches[i];
                    const title = match[1].trim();
                    const startIndex = match.index + match[0].length;
                    const endIndex = uniqueMatches[i + 1] ? uniqueMatches[i + 1].index : allText.length;
                    const content = allText.substring(startIndex, endIndex).trim();
                    
                    this.extractedContent.chapters.push({
                        title,
                        content,
                        id: `chapter_${i + 1}`
                    });
                }
            } else {
                // 未识别到章节，创建默认章节
                this.createDefaultChaptersForPreview(allText);
            }
        } else {
            // 即使未启用自动分章，也检查自定义章节
            const customMatches = this.getCustomChapterMatches(allText);
            if (customMatches.length > 0) {
                this.extractedContent.chapters = [];
                
                const firstMatchIndex = customMatches[0].index;
                if (firstMatchIndex > 0) {
                    const prefaceContent = allText.substring(0, firstMatchIndex).trim();
                    if (prefaceContent.length > 100) {
                        this.extractedContent.chapters.push({
                            title: '前言',
                            content: prefaceContent,
                            id: 'chapter_preface'
                        });
                    }
                }
                
                for (let i = 0; i < customMatches.length; i++) {
                    const match = customMatches[i];
                    const title = match[1].trim();
                    const startIndex = match.index + match[0].length;
                    const endIndex = customMatches[i + 1] ? customMatches[i + 1].index : allText.length;
                    const content = allText.substring(startIndex, endIndex).trim();
                    
                    this.extractedContent.chapters.push({
                        title,
                        content,
                        id: `chapter_${i + 1}`
                    });
                }
            } else {
                this.createDefaultChaptersForPreview(allText);
            }
        }
    }
    
    /**
     * 用于预览的默认章节创建
     */
    createDefaultChaptersForPreview(allText) {
        const pagesPerChapter = 10;
        this.extractedContent.chapters = [];
        
        for (let i = 0; i < this.extractedContent.pages.length; i += pagesPerChapter) {
            const endPage = Math.min(i + pagesPerChapter, this.extractedContent.pages.length);
            const chapterPages = this.extractedContent.pages.slice(i, endPage);
            const content = chapterPages.map(p => p.text).join('\n\n');
            const chapterNum = Math.floor(i / pagesPerChapter) + 1;
            
            this.extractedContent.chapters.push({
                title: `章节 ${chapterNum}`,
                content,
                id: `chapter_${chapterNum}`
            });
        }
    }

    displayPreview() {
        let html = '<div class="preview-chapters">';
        html += `<div class="preview-summary">共识别到 <strong>${this.extractedContent.chapters.length}</strong> 个章节</div>`;
        
        if (this.extractedContent.chapters.length > 0) {
            this.extractedContent.chapters.forEach((chapter, index) => {
                html += `
                    <div class="chapter">
                        <div class="chapter-title">📖 ${index + 1}. ${chapter.title || `章节 ${index + 1}`}</div>
                        <p>${this.truncateText(chapter.content, 300)}</p>
                    </div>
                `;
            });
        } else {
            this.extractedContent.pages.forEach((page, index) => {
                html += `
                    <div class="chapter">
                        <div class="chapter-title">📄 第 ${index + 1} 页</div>
                        <p>${this.truncateText(page.text, 300)}</p>
                    </div>
                `;
            });
        }
        
        html += '</div>';
        this.previewContent.innerHTML = html;
    }

    closePreview() {
        this.previewSection.hidden = true;
    }

    async startConversion() {
        if (!this.pdfDocument) {
            this.showToast('请先加载 PDF 文件', 'error');
            return;
        }

        if (!this.bookTitle.value.trim()) {
            this.showToast('请输入书名', 'error');
            this.bookTitle.focus();
            return;
        }

        // Show progress section
        this.settingsSection.hidden = true;
        this.previewSection.hidden = true;
        this.progressSection.hidden = false;
        this.progressDetails.innerHTML = '';

        try {
            // Step 1: Extract PDF content
            this.updateProgress(0, '正在提取 PDF 内容...');
            await this.extractPDFContent();

            // Step 2: Process and split chapters
            this.updateProgress(40, '正在分析章节结构...');
            await this.processChapters();

            // Step 3: Generate EPUB
            this.updateProgress(60, '正在生成 EPUB 文件...');
            await this.generateEPUB();

            // Complete
            this.updateProgress(100, '转换完成！');
            await this.delay(500);
            this.showComplete();

        } catch (error) {
            console.error('Conversion error:', error);
            this.showToast('转换失败：' + error.message, 'error');
            this.progressSection.hidden = true;
            this.settingsSection.hidden = false;
        }
    }

    async extractPDFContent(maxPages = null) {
        const numPages = maxPages || this.pdfDocument.numPages;
        this.extractedContent.pages = [];
        this.extractedContent.images = [];

        for (let i = 1; i <= Math.min(numPages, this.pdfDocument.numPages); i++) {
            const page = await this.pdfDocument.getPage(i);
            const textContent = await page.getTextContent();
            
            // Extract text with line information
            const lines = [];
            let currentLine = '';
            let lastY = null;
            let lastX = null;
            let lastFontSize = null;
            
            textContent.items.forEach(item => {
                const y = item.transform[5];
                const x = item.transform[4];
                const fontSize = Math.abs(item.transform[0]) || 12;
                
                // Detect new line (Y position changed significantly)
                if (lastY !== null && Math.abs(y - lastY) > 5) {
                    if (currentLine.trim()) {
                        lines.push({
                            text: currentLine.trim(),
                            x: lastX,
                            fontSize: lastFontSize
                        });
                    }
                    currentLine = '';
                }
                
                currentLine += item.str;
                if (lastX === null) lastX = x;
                lastY = y;
                lastFontSize = fontSize;
            });
            
            // Don't forget the last line
            if (currentLine.trim()) {
                lines.push({
                    text: currentLine.trim(),
                    x: lastX,
                    fontSize: lastFontSize
                });
            }
            
            // Apply smart paragraph merging if enabled
            const pageText = this.smartParagraph.checked 
                ? this.smartParagraphMerge(lines)
                : lines.map(l => l.text).join('\n');

            this.extractedContent.pages.push({
                pageNum: i,
                text: pageText.trim(),
                width: page.view[2],
                height: page.view[3]
            });

            // Extract images if enabled
            if (this.extractImages.checked) {
                try {
                    const images = await this.extractPageImages(page, i);
                    this.extractedContent.images.push(...images);
                } catch (e) {
                    console.warn('Failed to extract images from page', i, e);
                }
            }

            // Update progress for extraction phase (0-40%)
            const progress = Math.round((i / numPages) * 40);
            this.updateProgress(progress, `正在提取第 ${i}/${numPages} 页...`);
            this.addProgressDetail(`✓ 第 ${i} 页提取完成，${pageText.length} 字符`);
        }
    }

    async extractPageImages(page, pageNum) {
        const images = [];
        const operatorList = await page.getOperatorList();
        const ops = operatorList.fnArray;
        const args = operatorList.argsArray;

        for (let i = 0; i < ops.length; i++) {
            if (ops[i] === pdfjsLib.OPS.paintImageXObject || ops[i] === pdfjsLib.OPS.paintJpegXObject) {
                try {
                    const imgIndex = args[i][0];
                    const img = await page.objs.get(imgIndex);
                    
                    if (img && img.data) {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        
                        const imageData = ctx.createImageData(img.width, img.height);
                        
                        if (img.data.length === img.width * img.height * 4) {
                            imageData.data.set(img.data);
                        } else if (img.data.length === img.width * img.height * 3) {
                            // RGB to RGBA
                            for (let j = 0; j < img.width * img.height; j++) {
                                imageData.data[j * 4] = img.data[j * 3];
                                imageData.data[j * 4 + 1] = img.data[j * 3 + 1];
                                imageData.data[j * 4 + 2] = img.data[j * 3 + 2];
                                imageData.data[j * 4 + 3] = 255;
                            }
                        }
                        
                        ctx.putImageData(imageData, 0, 0);
                        
                        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
                        images.push({
                            pageNum,
                            width: img.width,
                            height: img.height,
                            data: dataUrl,
                            id: `img_${pageNum}_${images.length}`
                        });
                    }
                } catch (e) {
                    // Skip problematic images
                }
            }
        }

        return images;
    }

    async processChapters() {
        // Merge all pages and apply cross-page paragraph merging
        let allText = this.extractedContent.pages.map(p => p.text).join('\n\n');
        
        // Apply additional smart paragraph cleanup if enabled
        if (this.smartParagraph.checked) {
            allText = this.cleanupParagraphs(allText);
        }
        
        const pattern = this.chapterPattern.value;
        
        let chapterRegex;
        switch (pattern) {
            case 'chinese':
                // 匹配"第X章/节/回"
                chapterRegex = /^(第\s*[一二三四五六七八九十百千\d]+\s*[章节回部篇卷集].*?)$/gm;
                break;
            case 'english':
                chapterRegex = /^(Chapter\s+\d+.*?)$/gim;
                break;
            case 'number':
                chapterRegex = /^(\d+\.\s+.*?)$/gm;
                break;
            case 'padded':
                // 匹配两位数字开头的行，如 01 02 03 或 01- 02- 03-
                chapterRegex = /^(\d{2}[\s\-－].*)$/gm;
                break;
            default: // auto
                // 自动识别多种章节格式
                chapterRegex = /^(第\s*[一二三四五六七八九十百千\d]+\s*[章节回部篇卷集].*?|Chapter\s+\d+.*?|\d+\.\s+.{2,50}|\d{2}[\s\-－].{2,50})$/gim;
        }
        
        // 过滤掉分页信息（如"第1页"、"第 1-5 页"、"Page 1"等）
        const pageInfoPattern = /^(第\s*[\d\-\s~～]+\s*页|Page\s*[\d\-\s~]+|[\d\-~～]+\s*页|\d+\s*[-~～]\s*\d+)$/i;
        
        // 检查是否是分页信息的函数
        const isPageInfo = (title) => {
            // 匹配各种分页格式
            if (pageInfoPattern.test(title)) return true;
            // 检查是否包含"页"字且是分页格式
            if (/页\s*$/.test(title) && /[\d\-~～]/.test(title)) return true;
            // 检查"第...X...页"格式（包含数字和"页"）
            if (/^第.*页\s*$/.test(title) && /\d/.test(title)) return true;
            return false;
        };

        if (this.splitChapters.checked) {
            const matches = [...allText.matchAll(chapterRegex)];
            
            // 过滤掉分页信息
            const filteredMatches = matches.filter(match => {
                const title = match[1].trim();
                return !isPageInfo(title);
            });
            
            // 合并自定义章节标题匹配
            const customMatches = this.getCustomChapterMatches(allText);
            const allMatches = [...filteredMatches, ...customMatches];
            
            // 按位置排序并去重
            allMatches.sort((a, b) => a.index - b.index);
            const uniqueMatches = this.deduplicateMatches(allMatches);
            
            if (uniqueMatches.length > 0) {
                this.extractedContent.chapters = [];
                
                // 检查第一个章节之前是否有内容，如果有则作为“前言”
                const firstMatchIndex = uniqueMatches[0].index;
                if (firstMatchIndex > 0) {
                    const prefaceContent = allText.substring(0, firstMatchIndex).trim();
                    // 只有当前言内容超过100个字符时才添加
                    if (prefaceContent.length > 100) {
                        this.extractedContent.chapters.push({
                            title: '前言',
                            content: prefaceContent,
                            id: 'chapter_preface'
                        });
                        this.addProgressDetail(`✓ 识别到前言内容`);
                    }
                }
                
                for (let i = 0; i < uniqueMatches.length; i++) {
                    const match = uniqueMatches[i];
                    const title = match[1].trim();
                    const startIndex = match.index + match[0].length;
                    const endIndex = uniqueMatches[i + 1] ? uniqueMatches[i + 1].index : allText.length;
                    const content = allText.substring(startIndex, endIndex).trim();
                    
                    this.extractedContent.chapters.push({
                        title,
                        content,
                        id: `chapter_${i + 1}`
                    });
                }
                
                // 统计自动识别和自定义章节数量
                const customCount = uniqueMatches.filter(m => m.isCustom).length;
                const autoCount = uniqueMatches.length - customCount;
                if (customCount > 0 && autoCount > 0) {
                    this.addProgressDetail(`✓ 识别到 ${autoCount} 个自动章节 + ${customCount} 个自定义章节`);
                } else if (customCount > 0) {
                    this.addProgressDetail(`✓ 识别到 ${customCount} 个自定义章节`);
                } else {
                    this.addProgressDetail(`✓ 识别到 ${this.extractedContent.chapters.length} 个章节`);
                }
            } else {
                // No chapters found, create one chapter per page or group of pages
                this.createDefaultChapters();
            }
        } else {
            // 即使未启用自动分章，也检查自定义章节
            const customMatches = this.getCustomChapterMatches(allText);
            if (customMatches.length > 0) {
                this.extractedContent.chapters = [];
                
                const firstMatchIndex = customMatches[0].index;
                if (firstMatchIndex > 0) {
                    const prefaceContent = allText.substring(0, firstMatchIndex).trim();
                    if (prefaceContent.length > 100) {
                        this.extractedContent.chapters.push({
                            title: '前言',
                            content: prefaceContent,
                            id: 'chapter_preface'
                        });
                        this.addProgressDetail(`✓ 识别到前言内容`);
                    }
                }
                
                for (let i = 0; i < customMatches.length; i++) {
                    const match = customMatches[i];
                    const title = match[1].trim();
                    const startIndex = match.index + match[0].length;
                    const endIndex = customMatches[i + 1] ? customMatches[i + 1].index : allText.length;
                    const content = allText.substring(startIndex, endIndex).trim();
                    
                    this.extractedContent.chapters.push({
                        title,
                        content,
                        id: `chapter_${i + 1}`
                    });
                }
                
                this.addProgressDetail(`✓ 识别到 ${customMatches.length} 个自定义章节`);
            } else {
                this.createDefaultChapters();
            }
        }
    }

    createDefaultChapters() {
        const pagesPerChapter = 10;
        this.extractedContent.chapters = [];
        
        for (let i = 0; i < this.extractedContent.pages.length; i += pagesPerChapter) {
            const chapterPages = this.extractedContent.pages.slice(i, i + pagesPerChapter);
            let content = chapterPages.map(p => p.text).join('\n\n');
            // Apply paragraph cleanup if enabled
            if (this.smartParagraph.checked) {
                content = this.cleanupParagraphs(content);
            }
            const chapterNum = Math.floor(i / pagesPerChapter) + 1;
            
            this.extractedContent.chapters.push({
                title: `章节 ${chapterNum}`,
                content,
                id: `chapter_${chapterNum}`
            });
        }
        
        this.addProgressDetail(`✓ 创建了 ${this.extractedContent.chapters.length} 个默认章节（未识别到指定格式的章节标题）`);
    }

    /**
     * 获取自定义章节标题的匹配结果
     * @param {string} allText - 全部文本内容
     * @returns {Array} - 匹配结果数组，格式与正则匹配结果兼容
     */
    getCustomChapterMatches(allText) {
        const customChaptersText = this.customChapters?.value?.trim();
        if (!customChaptersText) return [];
        
        const customTitles = customChaptersText
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);
        
        if (customTitles.length === 0) return [];
        
        const matches = [];
        
        for (const title of customTitles) {
            // 转义正则特殊字符
            const escapedTitle = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // 创建匹配行首或段落开始的标题的正则
            const regex = new RegExp(`^(${escapedTitle})`, 'gm');
            
            let match;
            while ((match = regex.exec(allText)) !== null) {
                matches.push({
                    0: match[0],
                    1: match[1],
                    index: match.index,
                    isCustom: true  // 标记为自定义章节
                });
            }
        }
        
        return matches;
    }

    /**
     * 去除重叠的匹配项（优先保留自定义章节）
     * @param {Array} matches - 已排序的匹配数组
     * @returns {Array} - 去重后的匹配数组
     */
    deduplicateMatches(matches) {
        if (matches.length <= 1) return matches;
        
        const result = [];
        let lastEndIndex = -1;
        
        for (const match of matches) {
            // 如果当前匹配与上一个匹配重叠（位置差距小于50字符），跳过
            if (match.index < lastEndIndex + 50) {
                // 如果当前是自定义章节而上一个不是，替换上一个
                if (match.isCustom && result.length > 0 && !result[result.length - 1].isCustom) {
                    result[result.length - 1] = match;
                    lastEndIndex = match.index + match[0].length;
                }
                continue;
            }
            
            result.push(match);
            lastEndIndex = match.index + match[0].length;
        }
        
        return result;
    }

    /**
     * 智能段落合并 - 处理PDF中被错误换行的段落
     * @param {Array} lines - 包含文本和位置信息的行数组
     * @returns {string} - 合并后的文本
     */
    smartParagraphMerge(lines) {
        if (lines.length === 0) return '';
        
        const result = [];
        let currentParagraph = '';
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const nextLine = lines[i + 1];
            const text = line.text;
            
            // 判断当前行是否是段落结束
            const isEndOfParagraph = this.isLineEndOfParagraph(text, line, nextLine);
            
            if (currentParagraph) {
                // 判断是否应该合并到当前段落
                if (this.shouldMergeWithPrevious(text, line, lines[i - 1])) {
                    // 合并时，检查是否需要添加空格（针对英文）
                    const needsSpace = this.needsSpaceBetween(currentParagraph, text);
                    currentParagraph += (needsSpace ? ' ' : '') + text;
                } else {
                    // 开始新段落
                    result.push(currentParagraph);
                    currentParagraph = text;
                }
            } else {
                currentParagraph = text;
            }
            
            // 如果是段落结束，保存当前段落
            if (isEndOfParagraph && currentParagraph) {
                result.push(currentParagraph);
                currentParagraph = '';
            }
        }
        
        // 保存最后一个段落
        if (currentParagraph) {
            result.push(currentParagraph);
        }
        
        return result.join('\n\n');
    }

    /**
     * 判断当前行是否是段落的结束
     */
    isLineEndOfParagraph(text, currentLine, nextLine) {
        // 句子结束标点
        const sentenceEndingPunctuation = /[。！？.!?"'」』）)\]】]$/;
        
        // 如果以句子结束标点结尾，可能是段落结束
        if (sentenceEndingPunctuation.test(text)) {
            // 如果没有下一行，肯定是结束
            if (!nextLine) return true;
            
            // 如果下一行看起来是新段落的开始
            if (this.looksLikeNewParagraph(nextLine.text, nextLine, currentLine)) {
                return true;
            }
        }
        
        // 如果是空行或特别短的行，可能是段落结束
        if (text.length < 5) return true;
        
        // 如果下一行有明显的缩进差异（新段落通常有缩进）
        if (nextLine && nextLine.x - currentLine.x > 20) {
            return true;
        }
        
        // 标题行通常是单独的段落
        if (this.looksLikeTitle(text, currentLine)) {
            return true;
        }
        
        return false;
    }

    /**
     * 判断是否应该与前一行合并
     */
    shouldMergeWithPrevious(text, currentLine, prevLine) {
        if (!prevLine) return false;
        
        const prevText = prevLine.text;
        
        // 如果前一行是章节标题，不合并（章节标题应该独立成行）
        if (this.looksLikeTitle(prevText, prevLine)) {
            return false;
        }
        
        // 如果当前行看起来是新段落的开始，不合并
        if (this.looksLikeNewParagraph(text, currentLine, prevLine)) {
            return false;
        }
        
        // 如果前一行以句子结束标点结尾，且当前行像是新段落开始
        const sentenceEndingPunctuation = /[。！？.!?"'」』）)\]】]$/;
        if (sentenceEndingPunctuation.test(prevText)) {
            // 检查当前行是否像是新段落（首字缩进、以大写开头等）
            if (/^[A-Z「『（(【\["']/.test(text) || /^\s{2,}/.test(text)) {
                return false;
            }
        }
        
        // 如果前一行以连字符或不完整的句子结尾，应该合并
        if (/[-—、，,;；:：]$/.test(prevText)) {
            return true;
        }
        
        // 如果前一行不是以标点结尾，通常应该合并（被强制换行）
        if (!/[。！？.!?，,、；;：:"'」』）)\]】]$/.test(prevText)) {
            return true;
        }
        
        // 检查字体大小是否一致（同一段落通常字体一致）
        if (currentLine.fontSize && prevLine.fontSize) {
            if (Math.abs(currentLine.fontSize - prevLine.fontSize) < 2) {
                // 字体大小相近，且前一行不是句子结束
                if (!sentenceEndingPunctuation.test(prevText)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * 判断一行是否看起来像新段落的开始
     */
    looksLikeNewParagraph(text, currentLine, prevLine) {
        // 章节标题模式
        if (/^(第[一二三四五六七八九十百千\d]+[章节回]|Chapter\s+\d+|\d+\.\s)/i.test(text)) {
            return true;
        }
        
        // 两位数字编号标题模式 (如 01 02 03 或 01- 02- 03-)
        if (/^\d{2}[\s\-－]/.test(text)) {
            return true;
        }
        
        // 列表项
        if (/^[•·\-\*●○◆◇▪▫]\s/.test(text) || /^\d+[.、)）]\s/.test(text)) {
            return true;
        }
        
        // 明显的缩进（中文段落首行缩进）
        if (prevLine && currentLine.x - prevLine.x > 15) {
            return true;
        }
        
        // 以引号开始的可能是新段落
        if (/^[「『"'"']/.test(text) && prevLine && /[。！？.!?]$/.test(prevLine.text)) {
            return true;
        }
        
        return false;
    }

    /**
     * 判断一行是否看起来像标题
     */
    looksLikeTitle(text, line) {
        // 章节标题模式
        if (/^(第[一二三四五六七八九十百千\d]+[章节回]|Chapter\s+\d+|Part\s+\d+)/i.test(text)) {
            return true;
        }
        
        // 全大写的英文标题
        if (/^[A-Z\s]+$/.test(text) && text.length > 3 && text.length < 50) {
            return true;
        }
        
        // 数字编号标题 (如 1. 2. 或 1.1 等)
        if (/^\d+(\.\d+)*\s+.+$/.test(text) && text.length < 60) {
            return true;
        }
        
        // 两位数字编号标题 (如 01 02 03 或 01- 02- 03-)
        if (/^\d{2}[\s\-－]/.test(text)) {
            return true;
        }
        
        return false;
    }

    /**
     * 判断两段文本之间是否需要空格
     */
    needsSpaceBetween(text1, text2) {
        if (!text1 || !text2) return false;
        
        const lastChar = text1.slice(-1);
        const firstChar = text2.charAt(0);
        
        // 中文字符之间不需要空格
        const isChinese = /[\u4e00-\u9fa5]/;
        if (isChinese.test(lastChar) || isChinese.test(firstChar)) {
            return false;
        }
        
        // 英文单词之间需要空格
        const isAlphanumeric = /[a-zA-Z0-9]/;
        if (isAlphanumeric.test(lastChar) && isAlphanumeric.test(firstChar)) {
            return true;
        }
        
        // 标点符号后面跟字母需要空格
        if (/[.,;:!?]/.test(lastChar) && isAlphanumeric.test(firstChar)) {
            return true;
        }
        
        return false;
    }

    /**
     * 清理和优化段落结构
     */
    cleanupParagraphs(text) {
        // 移除多余的空行
        text = text.replace(/\n{3,}/g, '\n\n');
        
        // 处理跨页的段落合并
        // 如果一行不以句子结束标点结尾，且下一段不像新段落，则合并
        const paragraphs = text.split(/\n\n+/);
        const result = [];
        
        for (let i = 0; i < paragraphs.length; i++) {
            let para = paragraphs[i].trim();
            if (!para) continue;
            
            // 清理段落内的多余换行（保留必要的换行）
            para = this.cleanParagraphInternalBreaks(para);
            
            // 检查是否需要与下一段合并
            if (i < paragraphs.length - 1) {
                const nextPara = paragraphs[i + 1].trim();
                if (this.shouldMergeParagraphs(para, nextPara)) {
                    // 合并到下一段
                    const needsSpace = this.needsSpaceBetween(para, nextPara);
                    paragraphs[i + 1] = para + (needsSpace ? ' ' : '') + nextPara;
                    continue;
                }
            }
            
            result.push(para);
        }
        
        return result.join('\n\n');
    }

    /**
     * 清理段落内部的换行
     */
    cleanParagraphInternalBreaks(para) {
        const lines = para.split('\n');
        if (lines.length <= 1) return para;
        
        let result = lines[0];
        
        for (let i = 1; i < lines.length; i++) {
            const prevLine = lines[i - 1].trim();
            const currentLine = lines[i].trim();
            
            if (!currentLine) continue;
            
            // 判断是否应该合并
            const sentenceEnd = /[。！？.!?"'」』）)]$/;
            
            // 如果前一行是章节标题，不合并
            const prevIsTitle = this.looksLikeTitle(prevLine, {});
            
            // 如果当前行是新段落开始（包括章节标题），不合并
            const currentIsNewPara = this.looksLikeNewParagraph(currentLine, {x: 0}, {x: 0});
            
            if (!sentenceEnd.test(prevLine) && !prevIsTitle && !currentIsNewPara) {
                // 合并行
                const needsSpace = this.needsSpaceBetween(result, currentLine);
                result += (needsSpace ? ' ' : '') + currentLine;
            } else {
                result += '\n' + currentLine;
            }
        }
        
        return result;
    }

    /**
     * 判断两个段落是否应该合并
     */
    shouldMergeParagraphs(para1, para2) {
        // 如果第一段以句子结束标点结尾，通常不合并
        if (/[。！？.!?"'」』）)]$/.test(para1)) {
            return false;
        }
        
        // 如果第二段像是新段落的开始，不合并
        if (/^(第[一二三四五六七八九十百千\d]+[章节回]|Chapter\s+\d+|\d+\.\s|[•·\-\*●]|\d{2}[\s\-－])/i.test(para2)) {
            return false;
        }
        
        // 如果第一段是章节标题（两位数字格式），不合并
        if (/^\d{2}[\s\-－]/.test(para1)) {
            return false;
        }
        
        // 如果第一段以连接性标点结尾，应该合并
        if (/[，,、；;：:\-—]$/.test(para1)) {
            return true;
        }
        
        // 如果第一段不以任何标点结尾，可能是被截断的
        if (!/[。！？.!?，,、；;：:"'」』）)]$/.test(para1)) {
            return true;
        }
        
        return false;
    }

    async generateEPUB() {
        const zip = new JSZip();
        const bookId = this.generateUUID();
        const title = this.bookTitle.value.trim();
        const author = this.bookAuthor.value.trim() || '未知作者';
        const language = this.bookLanguage.value;
        const publisher = this.bookPublisher.value.trim();
        const description = this.bookDescription.value.trim();
        const fontSize = this.fontSize.value;

        // mimetype (must be first and uncompressed)
        zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

        // META-INF/container.xml
        zip.folder('META-INF').file('container.xml', `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`);

        // OEBPS folder
        const oebps = zip.folder('OEBPS');

        // Stylesheet
        oebps.file('styles.css', this.generateStylesheet(fontSize));

        // Generate chapters
        const chapters = this.extractedContent.chapters;
        const manifest = [];
        const spine = [];

        for (let i = 0; i < chapters.length; i++) {
            const chapter = chapters[i];
            const filename = `chapter_${i + 1}.xhtml`;
            const content = this.generateChapterXHTML(chapter, i + 1);
            oebps.file(filename, content);
            
            manifest.push(`<item id="chapter${i + 1}" href="${filename}" media-type="application/xhtml+xml"/>`);
            spine.push(`<itemref idref="chapter${i + 1}"/>`);
            
            // Update progress (60-90%)
            const progress = 60 + Math.round((i / chapters.length) * 30);
            this.updateProgress(progress, `正在生成章节 ${i + 1}/${chapters.length}...`);
        }

        // Add images
        const imagesFolder = oebps.folder('images');
        for (let i = 0; i < this.extractedContent.images.length; i++) {
            const img = this.extractedContent.images[i];
            const base64Data = img.data.split(',')[1];
            const filename = `${img.id}.jpg`;
            imagesFolder.file(filename, base64Data, { base64: true });
            manifest.push(`<item id="${img.id}" href="images/${filename}" media-type="image/jpeg"/>`);
        }

        // Generate TOC (toc.ncx)
        if (this.generateToc.checked) {
            oebps.file('toc.ncx', this.generateTocNCX(bookId, title, chapters));
            manifest.push('<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>');
        }

        // Generate navigation document (nav.xhtml)
        oebps.file('nav.xhtml', this.generateNavXHTML(chapters));
        manifest.push('<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>');

        // content.opf
        oebps.file('content.opf', this.generateContentOPF({
            bookId,
            title,
            author,
            language,
            publisher,
            description,
            manifest,
            spine
        }));

        // Generate EPUB blob
        this.updateProgress(95, '正在压缩文件...');
        this.epubBlob = await zip.generateAsync({ 
            type: 'blob',
            mimeType: 'application/epub+zip',
            compression: 'DEFLATE',
            compressionOptions: { level: 9 }
        });

        this.addProgressDetail(`✓ EPUB 生成完成，大小 ${this.formatFileSize(this.epubBlob.size)}`);
    }

    generateStylesheet(fontSize) {
        return `
@charset "UTF-8";

body {
    font-family: Georgia, "Times New Roman", serif;
    font-size: ${fontSize}px;
    line-height: 1.8;
    margin: 1em;
    padding: 0;
    text-align: justify;
}

h1 {
    font-size: 1.8em;
    font-weight: bold;
    margin: 1em 0 0.5em 0;
    text-align: center;
    page-break-after: avoid;
}

h2 {
    font-size: 1.4em;
    font-weight: bold;
    margin: 1em 0 0.5em 0;
    page-break-after: avoid;
}

h3 {
    font-size: 1.2em;
    font-weight: bold;
    margin: 0.8em 0 0.4em 0;
    page-break-after: avoid;
}

p {
    margin: 0.5em 0;
    text-indent: 2em;
}

img {
    max-width: 100%;
    height: auto;
    display: block;
    margin: 1em auto;
}

a {
    color: #0066cc;
    text-decoration: none;
}

.chapter-title {
    font-size: 1.5em;
    font-weight: bold;
    text-align: center;
    margin: 2em 0 1em 0;
    page-break-before: always;
}

nav#toc ol {
    list-style-type: none;
    padding-left: 1em;
}

nav#toc ol li {
    margin: 0.5em 0;
}

nav#toc a {
    text-decoration: none;
}
`;
    }

    generateChapterXHTML(chapter, index) {
        // Convert plain text to paragraphs
        const paragraphs = chapter.content
            .split(/\n\n+/)
            .filter(p => p.trim())
            .map(p => {
                // Escape HTML entities
                const escaped = p
                    .replace(/&/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
                    .replace(/'/g, '&#39;');
                return `<p>${escaped.replace(/\n/g, '<br/>')}</p>`;
            })
            .join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
    <meta charset="UTF-8"/>
    <title>${this.escapeXML(chapter.title)}</title>
    <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
    <h1 class="chapter-title">${this.escapeXML(chapter.title)}</h1>
    ${paragraphs}
</body>
</html>`;
    }

    generateTocNCX(bookId, title, chapters) {
        const navPoints = chapters.map((chapter, index) => `
    <navPoint id="navPoint-${index + 1}" playOrder="${index + 1}">
      <navLabel>
        <text>${this.escapeXML(chapter.title)}</text>
      </navLabel>
      <content src="chapter_${index + 1}.xhtml"/>
    </navPoint>`).join('');

        return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${this.escapeXML(title)}</text>
  </docTitle>
  <navMap>${navPoints}
  </navMap>
</ncx>`;
    }

    generateNavXHTML(chapters) {
        const tocItems = chapters.map((chapter, index) => 
            `      <li><a href="chapter_${index + 1}.xhtml">${this.escapeXML(chapter.title)}</a></li>`
        ).join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
    <meta charset="UTF-8"/>
    <title>目录</title>
    <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
    <nav epub:type="toc" id="toc">
      <h1>目录</h1>
      <ol>
${tocItems}
      </ol>
    </nav>
</body>
</html>`;
    }

    generateContentOPF(options) {
        const { bookId, title, author, language, publisher, description, manifest, spine } = options;
        const now = new Date().toISOString().split('.')[0] + 'Z';

        let metadataExtra = '';
        if (publisher) {
            metadataExtra += `\n    <dc:publisher>${this.escapeXML(publisher)}</dc:publisher>`;
        }
        if (description) {
            metadataExtra += `\n    <dc:description>${this.escapeXML(description)}</dc:description>`;
        }

        return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">${bookId}</dc:identifier>
    <dc:title>${this.escapeXML(title)}</dc:title>
    <dc:language>${language}</dc:language>
    <dc:creator>${this.escapeXML(author)}</dc:creator>
    <meta property="dcterms:modified">${now}</meta>${metadataExtra}
  </metadata>
  <manifest>
    <item id="css" href="styles.css" media-type="text/css"/>
${manifest.map(m => '    ' + m).join('\n')}
  </manifest>
  <spine toc="ncx">
${spine.map(s => '    ' + s).join('\n')}
  </spine>
</package>`;
    }

    showComplete() {
        this.progressSection.hidden = true;
        this.completeSection.hidden = false;

        const title = this.bookTitle.value.trim();
        this.resultFileName.textContent = `${title}.epub`;
        this.resultFileSize.textContent = this.formatFileSize(this.epubBlob.size);
        this.resultChapters.textContent = this.extractedContent.chapters.length;
        this.resultImages.textContent = this.extractedContent.images.length;
    }

    downloadEPUB() {
        const title = this.bookTitle.value.trim();
        const filename = `${title}.epub`;
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(this.epubBlob);
        link.download = filename;
        link.click();
        
        URL.revokeObjectURL(link.href);
        this.showToast('EPUB 下载已开始', 'success');
    }

    reset() {
        this.removeFile();
        this.completeSection.hidden = true;
        this.progressSection.hidden = true;
        this.previewSection.hidden = true;
        this.epubBlob = null;
        
        // Reset form
        this.bookTitle.value = '';
        this.bookAuthor.value = '';
        this.bookPublisher.value = '';
        this.bookDescription.value = '';
        this.customChapters.value = '';
        this.extractImages.checked = true;
        this.preserveLinks.checked = true;
        this.generateToc.checked = true;
        this.splitChapters.checked = true;
        this.smartParagraph.checked = true;
    }

    // Utility methods
    updateProgress(percent, status) {
        this.progressFill.style.width = `${percent}%`;
        this.progressText.textContent = `${percent}%`;
        this.progressStatus.textContent = status;
    }

    addProgressDetail(message) {
        const p = document.createElement('p');
        p.textContent = message;
        this.progressDetails.appendChild(p);
        this.progressDetails.scrollTop = this.progressDetails.scrollHeight;
    }

    showToast(message, type = 'info') {
        this.toast.className = `toast ${type}`;
        this.toastIcon.textContent = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        this.toastMessage.textContent = message;
        this.toast.hidden = false;

        setTimeout(() => {
            this.toast.hidden = true;
        }, 3000);
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    escapeXML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the converter when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.converter = new PDFToEPUBConverter();
});

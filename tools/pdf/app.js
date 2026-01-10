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
        this.fontSize = document.getElementById('fontSize');
        this.chapterPattern = document.getElementById('chapterPattern');

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
            await this.extractPDFContent(5); // Preview first 5 pages
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

    displayPreview() {
        let html = '<div class="preview-chapters">';
        
        if (this.extractedContent.chapters.length > 0) {
            this.extractedContent.chapters.forEach((chapter, index) => {
                html += `
                    <div class="chapter">
                        <div class="chapter-title">📖 ${chapter.title || `章节 ${index + 1}`}</div>
                        <p>${this.truncateText(chapter.content, 500)}</p>
                    </div>
                `;
            });
        } else {
            this.extractedContent.pages.forEach((page, index) => {
                html += `
                    <div class="chapter">
                        <div class="chapter-title">📄 第 ${index + 1} 页</div>
                        <p>${this.truncateText(page.text, 500)}</p>
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
            
            // Extract text
            let pageText = '';
            let lastY = null;
            
            textContent.items.forEach(item => {
                if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
                    pageText += '\n';
                }
                pageText += item.str;
                lastY = item.transform[5];
            });

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
        const allText = this.extractedContent.pages.map(p => p.text).join('\n\n');
        const pattern = this.chapterPattern.value;
        
        let chapterRegex;
        switch (pattern) {
            case 'chinese':
                chapterRegex = /^(第[一二三四五六七八九十百千\d]+[章节回].*?)$/gm;
                break;
            case 'english':
                chapterRegex = /^(Chapter\s+\d+.*?)$/gim;
                break;
            case 'number':
                chapterRegex = /^(\d+\.\s+.*?)$/gm;
                break;
            default: // auto
                chapterRegex = /^(第[一二三四五六七八九十百千\d]+[章节回].*?|Chapter\s+\d+.*?|\d+\.\s+.{2,50})$/gim;
        }

        if (this.splitChapters.checked) {
            const matches = [...allText.matchAll(chapterRegex)];
            
            if (matches.length > 0) {
                this.extractedContent.chapters = [];
                
                for (let i = 0; i < matches.length; i++) {
                    const match = matches[i];
                    const title = match[1].trim();
                    const startIndex = match.index + match[0].length;
                    const endIndex = matches[i + 1] ? matches[i + 1].index : allText.length;
                    const content = allText.substring(startIndex, endIndex).trim();
                    
                    this.extractedContent.chapters.push({
                        title,
                        content,
                        id: `chapter_${i + 1}`
                    });
                }
                
                this.addProgressDetail(`✓ 识别到 ${this.extractedContent.chapters.length} 个章节`);
            } else {
                // No chapters found, create one chapter per page or group of pages
                this.createDefaultChapters();
            }
        } else {
            this.createDefaultChapters();
        }
    }

    createDefaultChapters() {
        const pagesPerChapter = 10;
        this.extractedContent.chapters = [];
        
        for (let i = 0; i < this.extractedContent.pages.length; i += pagesPerChapter) {
            const chapterPages = this.extractedContent.pages.slice(i, i + pagesPerChapter);
            const content = chapterPages.map(p => p.text).join('\n\n');
            const startPage = i + 1;
            const endPage = Math.min(i + pagesPerChapter, this.extractedContent.pages.length);
            
            this.extractedContent.chapters.push({
                title: `第 ${startPage}-${endPage} 页`,
                content,
                id: `chapter_${Math.floor(i / pagesPerChapter) + 1}`
            });
        }
        
        this.addProgressDetail(`✓ 创建了 ${this.extractedContent.chapters.length} 个默认章节`);
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
        this.extractImages.checked = true;
        this.preserveLinks.checked = true;
        this.generateToc.checked = true;
        this.splitChapters.checked = true;
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

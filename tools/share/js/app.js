// Main App Module
import { CardManager } from './card-manager.js';
import { LinkFetcher } from './link-fetcher.js';
import { CardRenderer } from './card-renderer.js';
import { SettingsManager } from './settings.js';
import { GeminiAPI } from './gemini-api.js';
import { showToast, showLoading, hideLoading } from './ui-utils.js';

class ShareCardApp {
    constructor() {
        this.currentStep = 'typeSelect';
        this.selectedType = null;
        this.cardData = null;
        this.currentTheme = 'modern';
        this.aiGeneratedStyle = null;
        
        this.cardManager = new CardManager();
        this.linkFetcher = new LinkFetcher();
        this.cardRenderer = new CardRenderer();
        this.settings = new SettingsManager();
        this.geminiAPI = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.showStep('typeSelect');
    }
    
    bindEvents() {
        // Type selection
        document.querySelectorAll('.type-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.selectType(type);
            });
        });
        
        // Back buttons
        document.getElementById('backBtn')?.addEventListener('click', () => {
            this.showStep('typeSelect');
        });
        
        document.getElementById('backToEditBtn')?.addEventListener('click', () => {
            this.showStep('cardInput');
        });
        
        // Preview button
        document.getElementById('previewBtn')?.addEventListener('click', () => {
            this.handlePreview();
        });
        
        // Download button
        document.getElementById('downloadBtn')?.addEventListener('click', () => {
            this.handleDownload();
        });
        
        // Theme selection
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const theme = e.target.dataset.theme;
                this.selectTheme(theme);
            });
        });
        
        // Settings
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            this.openSettings();
        });
        
        document.getElementById('closeSettingsBtn')?.addEventListener('click', () => {
            this.closeSettings();
        });
        
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
            this.saveSettings();
        });
        
        // Overlay
        document.getElementById('overlay')?.addEventListener('click', () => {
            this.closeSettings();
        });
    }
    
    selectType(type) {
        this.selectedType = type;
        this.cardManager.setType(type);
        this.showStep('cardInput');
        this.renderForm();
    }
    
    renderForm() {
        const form = document.getElementById('cardForm');
        if (!form) return;
        
        form.innerHTML = this.cardManager.getFormHTML();
        
        // Add event listeners for dynamic form elements
        this.bindFormEvents();
    }
    
    bindFormEvents() {
        // Fetch button for music/podcast
        const fetchBtn = document.querySelector('.btn-fetch');
        if (fetchBtn) {
            fetchBtn.addEventListener('click', () => this.handleFetchMetadata());
        }
        
        // Generate summary checkbox for article
        const generateSummaryCheckbox = document.getElementById('generateSummary');
        if (generateSummaryCheckbox) {
            generateSummaryCheckbox.addEventListener('change', (e) => {
                const summaryField = document.getElementById('summaryField');
                if (summaryField) {
                    summaryField.style.display = e.target.checked ? 'none' : 'block';
                }
            });
        }
        
        // Text highlighting for text card
        const textContent = document.getElementById('textContent');
        if (textContent && this.selectedType === 'text') {
            this.setupTextHighlighting(textContent);
        }
    }
    
    async handleFetchMetadata() {
        const urlInput = document.getElementById('url');
        if (!urlInput || !urlInput.value) {
            showToast('请输入链接');
            return;
        }
        
        showLoading('获取信息中...');
        
        try {
            const metadata = await this.linkFetcher.fetchMetadata(
                urlInput.value, 
                this.selectedType
            );
            
            if (metadata) {
                this.fillFormWithMetadata(metadata);
                showToast('信息获取成功');
            } else {
                showToast('无法自动获取信息，请手动填写');
            }
        } catch (error) {
            console.error('Fetch error:', error);
            showToast('获取失败，请手动填写');
        } finally {
            hideLoading();
        }
    }
    
    fillFormWithMetadata(metadata) {
        if (metadata.title) {
            const titleInput = document.getElementById('title') || 
                             document.getElementById('songName') || 
                             document.getElementById('episodeName');
            if (titleInput) titleInput.value = metadata.title;
        }
        
        if (metadata.artist) {
            const artistInput = document.getElementById('artist');
            if (artistInput) artistInput.value = metadata.artist;
        }
        
        if (metadata.podcastName) {
            const podcastInput = document.getElementById('podcastName');
            if (podcastInput) podcastInput.value = metadata.podcastName;
        }
        
        if (metadata.author) {
            const authorInput = document.getElementById('author');
            if (authorInput) authorInput.value = metadata.author;
        }
        
        if (metadata.cover) {
            const coverInput = document.getElementById('coverUrl');
            if (coverInput) coverInput.value = metadata.cover;
        }
        
        if (metadata.description) {
            const summaryInput = document.getElementById('summary');
            if (summaryInput) summaryInput.value = metadata.description;
        }
    }
    
    setupTextHighlighting(textarea) {
        // This is a simplified version - in production you'd want a proper rich text editor
        textarea.addEventListener('mouseup', () => {
            const selection = window.getSelection();
            const selectedText = selection.toString();
            
            if (selectedText.length > 0) {
                const confirmHighlight = confirm('高亮选中的文字？');
                if (confirmHighlight) {
                    // Store highlighted text positions for later rendering
                    if (!this.highlightedRanges) {
                        this.highlightedRanges = [];
                    }
                    this.highlightedRanges.push({
                        text: selectedText,
                        start: textarea.selectionStart,
                        end: textarea.selectionEnd
                    });
                }
            }
        });
    }
    
    async handlePreview() {
        const formData = this.getFormData();
        
        if (!this.validateFormData(formData)) {
            showToast('请填写必填字段');
            return;
        }
        
        // Generate summary if needed
        if (this.selectedType === 'article' && formData.generateSummary) {
            showLoading('生成摘要中...');
            try {
                const summary = await this.generateSummary(formData);
                formData.summary = summary;
            } catch (error) {
                console.error('Summary generation error:', error);
                showToast('摘要生成失败，请手动填写');
                hideLoading();
                return;
            }
            hideLoading();
        }
        
        this.cardData = formData;
        this.showStep('preview');
        this.renderPreview();
    }
    
    getFormData() {
        const form = document.getElementById('cardForm');
        const formData = {
            type: this.selectedType
        };
        
        // Collect all form inputs
        form.querySelectorAll('input, textarea').forEach(input => {
            if (input.type === 'checkbox') {
                formData[input.id] = input.checked;
            } else {
                formData[input.id] = input.value;
            }
        });
        
        // Add highlighted ranges for text card
        if (this.highlightedRanges) {
            formData.highlights = this.highlightedRanges;
        }
        
        return formData;
    }
    
    validateFormData(data) {
        // Basic validation based on card type
        switch (this.selectedType) {
            case 'music':
                return data.songName && data.artist;
            case 'podcast':
                return data.episodeName && data.podcastName;
            case 'article':
                return data.title && data.author;
            case 'text':
                return data.textContent && data.textContent.length > 0;
            default:
                return false;
        }
    }
    
    async generateSummary(formData) {
        const apiKey = this.settings.get('apiKey');
        const apiProxy = this.settings.get('apiProxy');
        
        if (!apiKey) {
            throw new Error('未设置 OpenAI API Key');
        }
        
        // Note: This is a simplified implementation. In a production environment,
        // you would need to fetch and extract the article content first before
        // sending it to OpenAI. OpenAI cannot directly access URLs.
        // For now, we ask the AI to generate a generic summary based on the URL/title.
        
        const endpoint = apiProxy || 'https://api.openai.com/v1/chat/completions';
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的文章摘要生成助手。请为文章生成150字左右的中文摘要。由于无法访问具体内容，请根据标题和链接生成一个合理的描述性摘要。'
                    },
                    {
                        role: 'user',
                        content: `文章链接：${formData.url || ''}\n文章标题：${formData.title || ''}\n\n请生成一个150字左右的摘要。`
                    }
                ],
                max_tokens: 300,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || 'API request failed');
        }
        
        const data = await response.json();
        return data.choices[0].message.content;
    }
    
    renderPreview() {
        const preview = document.getElementById('cardPreview');
        if (!preview) return;
        
        const html = this.cardRenderer.render(this.cardData, this.currentTheme);
        preview.innerHTML = html;
        preview.className = `card-preview theme-${this.currentTheme}`;
        
        // Apply AI-generated style if available
        if (this.currentTheme === 'ai' && this.aiGeneratedStyle) {
            const cardElement = preview.firstElementChild;
            if (cardElement && this.geminiAPI) {
                this.geminiAPI.applyStyleToCard(cardElement, this.aiGeneratedStyle);
            }
        }
    }
    
    selectTheme(theme) {
        // If AI theme is selected, generate AI-powered style
        if (theme === 'ai') {
            this.generateAIStyle();
            return;
        }
        
        this.currentTheme = theme;
        this.aiGeneratedStyle = null; // Clear AI style when selecting preset theme
        
        // Update active button
        document.querySelectorAll('.theme-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
        
        // Re-render preview
        this.renderPreview();
    }
    
    async generateAIStyle() {
        const geminiApiKey = this.settings.get('geminiApiKey');
        
        if (!geminiApiKey) {
            showToast('请先在设置中配置 Gemini API Key');
            setTimeout(() => {
                this.openSettings();
            }, 1000);
            return;
        }
        
        showLoading('AI正在生成最佳样式...');
        
        try {
            this.geminiAPI = new GeminiAPI(geminiApiKey);
            const styleConfig = await this.geminiAPI.generateCardStyle(this.cardData);
            
            this.aiGeneratedStyle = styleConfig;
            this.currentTheme = 'ai';
            
            // Update active button
            document.querySelectorAll('.theme-btn').forEach(btn => {
                btn.classList.toggle('active', btn.dataset.theme === 'ai');
            });
            
            // Render with AI style
            this.renderPreview();
            showToast('AI样式生成成功！');
        } catch (error) {
            console.error('AI style generation error:', error);
            showToast('AI样式生成失败: ' + error.message);
        } finally {
            hideLoading();
        }
    }
    
    async handleDownload() {
        showLoading('生成图片中...');
        
        try {
            const canvas = document.getElementById('cardCanvas');
            const preview = document.getElementById('cardPreview');
            
            // Set canvas dimensions (2x for retina display)
            canvas.width = 390 * 2;
            canvas.height = 520 * 2;
            
            const ctx = canvas.getContext('2d');
            ctx.scale(2, 2);
            
            // Render card to canvas
            await this.renderToCanvas(ctx, preview);
            
            // Download
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.download = `share-card-${Date.now()}.png`;
            link.href = dataUrl;
            link.click();
            
            showToast('卡片已下载');
        } catch (error) {
            console.error('Download error:', error);
            showToast('下载失败，请重试');
        } finally {
            hideLoading();
        }
    }
    
    async renderToCanvas(ctx, element) {
        // Use html2canvas library for rendering
        try {
            const { default: html2canvas } = await import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/+esm');
            
            const canvas = await html2canvas(element, {
                width: 390,
                height: 520,
                scale: 2,
                backgroundColor: null,
                logging: false,
                useCORS: true,
                allowTaint: true
            });
            
            // Clear and draw the captured canvas
            ctx.clearRect(0, 0, 390, 520);
            ctx.drawImage(canvas, 0, 0, 390, 520);
        } catch (error) {
            console.error('Canvas render error:', error);
            throw error;
        }
    }
    
    showStep(step) {
        this.currentStep = step;
        
        // Hide all steps
        document.querySelectorAll('.step-container').forEach(container => {
            container.classList.remove('active');
        });
        
        // Show current step
        const stepMap = {
            'typeSelect': 'stepTypeSelect',
            'cardInput': 'stepCardInput',
            'preview': 'stepPreview'
        };
        
        const stepElement = document.getElementById(stepMap[step]);
        if (stepElement) {
            stepElement.classList.add('active');
        }
    }
    
    openSettings() {
        const panel = document.getElementById('settingsPanel');
        const overlay = document.getElementById('overlay');
        
        panel?.classList.add('active');
        overlay?.classList.add('active');
        
        // Load current settings
        const geminiApiKey = this.settings.get('geminiApiKey') || '';
        const apiKey = this.settings.get('apiKey') || '';
        const apiProxy = this.settings.get('apiProxy') || '';
        
        const geminiInput = document.getElementById('geminiApiKey');
        if (geminiInput) geminiInput.value = geminiApiKey;
        
        document.getElementById('apiKey').value = apiKey;
        document.getElementById('apiProxy').value = apiProxy;
    }
    
    closeSettings() {
        const panel = document.getElementById('settingsPanel');
        const overlay = document.getElementById('overlay');
        
        panel?.classList.remove('active');
        overlay?.classList.remove('active');
    }
    
    saveSettings() {
        const geminiApiKey = document.getElementById('geminiApiKey')?.value || '';
        const apiKey = document.getElementById('apiKey').value;
        const apiProxy = document.getElementById('apiProxy').value;
        
        this.settings.set('geminiApiKey', geminiApiKey);
        this.settings.set('apiKey', apiKey);
        this.settings.set('apiProxy', apiProxy);
        
        showToast('设置已保存');
        this.closeSettings();
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ShareCardApp();
});

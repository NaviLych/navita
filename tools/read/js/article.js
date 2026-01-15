// Article parsing and management
import database from './db.js';
import UI from './ui.js';

class ArticleManager {
    async addArticle(url, manualData = null) {
        try {
            // Check if article already exists
            const existing = await database.getArticleByUrl(url);
            if (existing) {
                UI.showToast('该文章已存在', 'info');
                return existing;
            }

            UI.showLoading();

            if (manualData) {
                // Use manually provided data
                const article = await database.addArticle({
                    url,
                    title: manualData.title,
                    excerpt: manualData.excerpt,
                    cover: manualData.cover,
                    domain: UI.extractDomain(url),
                    estReadTime: manualData.estReadTime || UI.estimateReadTime(manualData.excerpt)
                });
                UI.hideLoading();
                return article;
            }

            // Try to fetch and parse the article
            try {
                const articleData = await this.fetchAndParse(url);
                const article = await database.addArticle(articleData);
                UI.hideLoading();
                return article;
            } catch (fetchError) {
                UI.hideLoading();
                // Show manual input modal if fetch fails
                this.showManualInputModal(url);
                return null;
            }
        } catch (error) {
            UI.hideLoading();
            UI.showToast('添加文章失败: ' + error.message, 'error');
            throw error;
        }
    }

    async fetchAndParse(url) {
        // Try multiple methods to fetch content, including CORS proxies
        const proxies = [
            null, // Try direct fetch first
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
        ];
        
        let lastError = null;
        
        for (const proxy of proxies) {
            try {
                const fetchUrl = proxy ? `${proxy}${encodeURIComponent(url)}` : url;
                const response = await fetch(fetchUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                
                const html = await response.text();
                
                // Parse HTML
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                
                // Extract metadata with better fallbacks
                const title = doc.querySelector('meta[property="og:title"]')?.content ||
                             doc.querySelector('meta[name="twitter:title"]')?.content ||
                             doc.querySelector('title')?.textContent ||
                             doc.querySelector('h1')?.textContent ||
                             '无标题';
                
                const excerpt = doc.querySelector('meta[property="og:description"]')?.content ||
                               doc.querySelector('meta[name="twitter:description"]')?.content ||
                               doc.querySelector('meta[name="description"]')?.content ||
                               '';
                
                const cover = doc.querySelector('meta[property="og:image"]')?.content ||
                             doc.querySelector('meta[name="twitter:image"]')?.content ||
                             doc.querySelector('article img')?.src ||
                             doc.querySelector('img')?.src ||
                             '';
                
                // Simple content extraction (in production, use Readability.js)
                const article = doc.querySelector('article') || doc.querySelector('main') || doc.body;
                const content = article?.textContent || '';
                
                // Successfully parsed, return the data
                return {
                    url,
                    title: title.trim(),
                    excerpt: excerpt.substring(0, 300),
                    cover: cover ? this.resolveUrl(cover, url) : '',
                    domain: UI.extractDomain(url),
                    estReadTime: UI.estimateReadTime(content),
                    content: content.substring(0, 50000) // Store first 50k chars
                };
            } catch (error) {
                lastError = error;
                // Continue to next proxy
                continue;
            }
        }
        
        // All methods failed
        throw new Error(`无法获取文章内容: ${lastError?.message || '未知错误'}`);
    }
    
    resolveUrl(urlString, baseUrl) {
        try {
            // Handle relative URLs
            return new URL(urlString, baseUrl).href;
        } catch (e) {
            // If URL parsing fails, return empty string
            return '';
        }
    }

    showManualInputModal(url) {
        const content = `
            <form id="manual-article-form">
                <input type="hidden" name="url" value="${url}">
                <div class="form-group">
                    <label>文章标题 *</label>
                    <input type="text" name="title" required placeholder="请输入文章标题">
                </div>
                <div class="form-group">
                    <label>摘要</label>
                    <textarea name="excerpt" rows="4" placeholder="请输入文章摘要（可选）"></textarea>
                </div>
                <div class="form-group">
                    <label>封面图片 URL</label>
                    <input type="url" name="cover" placeholder="https://example.com/image.jpg">
                </div>
                <div class="form-group">
                    <label>预计阅读时长（分钟）</label>
                    <input type="number" name="estReadTime" min="1" value="5">
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="window.UI.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="window.articleManager.submitManualArticle()">保存</button>
        `;

        UI.showModal(content, { title: '手动添加文章信息', footer });
    }

    async submitManualArticle() {
        const form = document.getElementById('manual-article-form');
        const formData = new FormData(form);
        
        const data = {
            title: formData.get('title'),
            excerpt: formData.get('excerpt'),
            cover: formData.get('cover'),
            estReadTime: parseInt(formData.get('estReadTime')) || 5
        };
        
        if (!data.title) {
            UI.showToast('请输入文章标题', 'error');
            return;
        }
        
        const url = formData.get('url');
        await this.addArticle(url, data);
        UI.closeModal();
        UI.showToast('文章添加成功', 'success');
    }

    async updateArticle(id, data) {
        return await database.updateArticle(id, data);
    }

    async deleteArticle(id) {
        // Also delete associated read later item and notes
        const readLaterItem = await database.getReadLaterItemByArticleId(id);
        if (readLaterItem) {
            await database.deleteReadLaterItem(readLaterItem.id);
        }
        
        const notes = await database.getNotesByArticleId(id);
        for (const note of notes) {
            await database.deleteNote(note.id);
        }
        
        await database.deleteArticle(id);
        UI.showToast('文章已删除', 'success');
    }

    async getArticle(id) {
        return await database.getArticle(id);
    }

    async searchArticles(query) {
        return await database.searchArticles(query);
    }

    async importBookmarks(file) {
        try {
            UI.showLoading();
            const text = await file.text();
            
            let urls = [];
            
            // Try to parse as HTML bookmarks
            if (file.name.endsWith('.html')) {
                const parser = new DOMParser();
                const doc = parser.parseFromString(text, 'text/html');
                const links = doc.querySelectorAll('a[href]');
                urls = Array.from(links).map(a => ({
                    url: a.href,
                    title: a.textContent
                }));
            } else if (file.name.endsWith('.json')) {
                // Parse as JSON
                const data = JSON.parse(text);
                urls = Array.isArray(data) ? data : [data];
            }
            
            let added = 0;
            for (const item of urls) {
                try {
                    await this.addArticle(item.url, {
                        title: item.title || 'Imported',
                        excerpt: item.description || '',
                        cover: '',
                        estReadTime: 5
                    });
                    added++;
                } catch (error) {
                    console.error('Failed to import:', item.url, error);
                }
            }
            
            UI.hideLoading();
            UI.showToast(`成功导入 ${added} 篇文章`, 'success');
        } catch (error) {
            UI.hideLoading();
            UI.showToast('导入失败: ' + error.message, 'error');
        }
    }
}

const articleManager = new ArticleManager();
window.articleManager = articleManager; // For modal callbacks

export default articleManager;
export { articleManager };

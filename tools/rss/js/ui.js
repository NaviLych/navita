// UI module
// Handles user interface interactions and updates

import db from './db.js';
import feedsManager from './feeds.js';
import articlesManager from './articles.js';

class UI {
    constructor() {
        this.elements = {};
        this.theme = 'light';
    }

    // Initialize UI
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.loadTheme();
    }

    // Cache DOM elements
    cacheElements() {
        this.elements = {
            // Header
            refreshBtn: document.getElementById('refresh-btn'),
            themeToggle: document.getElementById('theme-toggle'),

            // Sidebar
            sidebar: document.getElementById('sidebar'),
            feedsList: document.getElementById('feeds-list'),
            addFeedBtn: document.getElementById('add-feed-btn'),

            // Articles section
            articlesSection: document.getElementById('articles-section'),
            sectionTitle: document.getElementById('section-title'),
            articlesList: document.getElementById('articles-list'),
            viewUnread: document.getElementById('view-unread'),
            viewAll: document.getElementById('view-all'),
            viewStarred: document.getElementById('view-starred'),

            // Reader section
            readerSection: document.getElementById('reader-section'),
            readerContent: document.getElementById('reader-content'),
            closeReader: document.getElementById('close-reader'),
            readerStar: document.getElementById('reader-star'),
            readerShare: document.getElementById('reader-share'),
            openOriginal: document.getElementById('open-original'),

            // Modals
            modalOverlay: document.getElementById('modal-overlay'),
            addFeedModal: document.getElementById('add-feed-modal'),
            feedUrl: document.getElementById('feed-url'),
            feedName: document.getElementById('feed-name'),
            submitFeed: document.getElementById('submit-feed'),
            settingsModal: document.getElementById('settings-modal'),

            // Toast and loading
            toastContainer: document.getElementById('toast-container'),
            loading: document.getElementById('loading')
        };
    }

    // Setup event listeners
    setupEventListeners() {
        // Theme toggle
        this.elements.themeToggle?.addEventListener('click', () => this.toggleTheme());

        // Refresh all feeds
        this.elements.refreshBtn?.addEventListener('click', () => this.handleRefreshAll());

        // Add feed
        this.elements.addFeedBtn?.addEventListener('click', () => this.openAddFeedModal());
        this.elements.submitFeed?.addEventListener('click', () => this.handleAddFeed());

        // View filters
        this.elements.viewUnread?.addEventListener('click', () => this.handleViewChange('unread'));
        this.elements.viewAll?.addEventListener('click', () => this.handleViewChange('all'));
        this.elements.viewStarred?.addEventListener('click', () => this.handleViewChange('starred'));

        // Reader actions
        this.elements.closeReader?.addEventListener('click', () => this.closeReader());
        this.elements.readerStar?.addEventListener('click', () => this.handleReaderStar());
        this.elements.readerShare?.addEventListener('click', () => this.handleShare());
        this.elements.openOriginal?.addEventListener('click', () => this.handleOpenOriginal());

        // Modal overlay click
        this.elements.modalOverlay?.addEventListener('click', () => this.closeAllModals());

        // Mobile navigation
        const mobileNavItems = document.querySelectorAll('.mobile-nav .nav-item');
        mobileNavItems.forEach(item => {
            item.addEventListener('click', () => this.handleMobileNav(item));
        });
    }

    // Theme management
    loadTheme() {
        const savedTheme = localStorage.getItem('rss-theme') || 'light';
        this.setTheme(savedTheme);
    }

    setTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('rss-theme', theme);
        
        if (this.elements.themeToggle) {
            this.elements.themeToggle.querySelector('.icon').textContent = theme === 'dark' ? '☀️' : '🌙';
        }
    }

    toggleTheme() {
        const newTheme = this.theme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    // Render feeds list
    async renderFeeds() {
        const feeds = await feedsManager.loadFeeds();
        
        if (feeds.length === 0) {
            this.elements.feedsList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <p>还没有订阅源</p>
                    <p class="hint">点击右上角 ➕ 添加</p>
                </div>
            `;
            return;
        }

        this.elements.feedsList.innerHTML = feeds.map(feed => `
            <div class="feed-item" data-feed-id="${feed.id}">
                <div class="feed-info">
                    <span class="feed-name">${this.escapeHtml(feed.title)}</span>
                    <span class="feed-count">${feed.unreadCount || 0} 未读</span>
                </div>
                <div class="feed-actions">
                    <button class="btn-icon delete-feed" data-feed-id="${feed.id}" title="删除订阅">🗑️</button>
                </div>
            </div>
        `).join('');

        // Add click handlers
        this.elements.feedsList.querySelectorAll('.feed-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.feed-actions')) {
                    this.handleFeedClick(parseInt(item.dataset.feedId));
                }
            });
        });

        this.elements.feedsList.querySelectorAll('.delete-feed').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.handleDeleteFeed(parseInt(btn.dataset.feedId));
            });
        });
    }

    // Render articles list
    async renderArticles() {
        const articles = await articlesManager.loadArticles();

        if (articles.length === 0) {
            this.elements.articlesList.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📄</div>
                    <p>没有文章</p>
                </div>
            `;
            return;
        }

        const articlesHTML = await Promise.all(articles.map(async article => {
            const feedName = await articlesManager.getFeedName(article.feedId);
            const dateStr = articlesManager.formatDate(article.pubDate);
            const readClass = article.read ? 'read' : '';
            const starIcon = article.starred ? '★' : '☆';

            return `
                <div class="article-item ${readClass}" data-article-id="${article.id}">
                    <div class="article-header">
                        <div class="article-meta">
                            <span class="article-source">${this.escapeHtml(feedName)}</span>
                            <span>•</span>
                            <span class="article-date">${dateStr}</span>
                        </div>
                        <div class="article-actions">
                            <button class="btn-icon star-article" data-article-id="${article.id}" title="收藏">${starIcon}</button>
                        </div>
                    </div>
                    <h3 class="article-title">${this.escapeHtml(article.title)}</h3>
                    <p class="article-excerpt">${this.escapeHtml(article.description)}</p>
                </div>
            `;
        }));

        this.elements.articlesList.innerHTML = articlesHTML.join('');

        // Add click handlers
        this.elements.articlesList.querySelectorAll('.article-item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.closest('.article-actions')) {
                    this.handleArticleClick(parseInt(item.dataset.articleId));
                }
            });
        });

        this.elements.articlesList.querySelectorAll('.star-article').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const articleId = parseInt(btn.dataset.articleId);
                const isStarred = await articlesManager.toggleStar(articleId);
                btn.textContent = isStarred ? '★' : '☆';
                await this.renderArticles();
            });
        });
    }

    // Handle feed click
    async handleFeedClick(feedId) {
        articlesManager.setFeedFilter(feedId);
        feedsManager.setCurrentFeed(feedId);
        
        // Update active state
        this.elements.feedsList.querySelectorAll('.feed-item').forEach(item => {
            item.classList.toggle('active', parseInt(item.dataset.feedId) === feedId);
        });

        const feed = feedsManager.getFeedById(feedId);
        this.elements.sectionTitle.textContent = feed ? feed.title : '所有文章';

        await this.renderArticles();
    }

    // Handle article click
    async handleArticleClick(articleId) {
        const article = await articlesManager.getArticle(articleId);
        if (!article) return;

        articlesManager.setCurrentArticle(articleId);

        // Mark as read
        await articlesManager.markAsRead(articleId, true);

        // Show reader
        this.showReader(article);

        // Update feeds list to reflect new unread count
        await this.renderFeeds();
    }

    // Show article reader
    async showReader(article) {
        const feedName = await articlesManager.getFeedName(article.feedId);
        const dateStr = articlesManager.formatDate(article.pubDate);
        const starIcon = article.starred ? '★' : '☆';

        this.elements.readerContent.innerHTML = `
            <h1>${this.escapeHtml(article.title)}</h1>
            <div class="article-meta">
                <span class="article-source">${this.escapeHtml(feedName)}</span>
                <span>•</span>
                <span class="article-date">${dateStr}</span>
                ${article.author ? `<span>•</span><span>${this.escapeHtml(article.author)}</span>` : ''}
            </div>
            <div class="article-body">${article.content}</div>
        `;

        this.elements.readerStar.textContent = starIcon;
        this.elements.readerSection.classList.remove('hidden');
        this.elements.articlesSection.style.display = 'none';
    }

    // Close reader
    closeReader() {
        this.elements.readerSection.classList.add('hidden');
        this.elements.articlesSection.style.display = 'flex';
        articlesManager.setCurrentArticle(null);
        this.renderArticles();
    }

    // Handle reader star
    async handleReaderStar() {
        const articleId = articlesManager.getCurrentArticle();
        if (!articleId) return;

        const isStarred = await articlesManager.toggleStar(articleId);
        this.elements.readerStar.textContent = isStarred ? '★' : '☆';
        showToast(isStarred ? '已添加到收藏' : '已取消收藏', 'success');
    }

    // Handle share
    async handleShare() {
        const articleId = articlesManager.getCurrentArticle();
        if (!articleId) return;

        const article = await articlesManager.getArticle(articleId);
        if (article && article.link) {
            if (navigator.share) {
                try {
                    await navigator.share({
                        title: article.title,
                        url: article.link
                    });
                } catch (err) {
                    if (err.name !== 'AbortError') {
                        this.copyToClipboard(article.link);
                    }
                }
            } else {
                this.copyToClipboard(article.link);
            }
        }
    }

    // Handle open original
    async handleOpenOriginal() {
        const articleId = articlesManager.getCurrentArticle();
        if (!articleId) return;

        const article = await articlesManager.getArticle(articleId);
        if (article && article.link) {
            window.open(article.link, '_blank');
        }
    }

    // Copy to clipboard
    copyToClipboard(text) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('链接已复制到剪贴板', 'success');
        }).catch(() => {
            showToast('复制失败', 'error');
        });
    }

    // Handle view change
    async handleViewChange(view) {
        articlesManager.setView(view);
        
        // Update button states
        this.elements.viewUnread.classList.toggle('active', view === 'unread');
        this.elements.viewAll.classList.toggle('active', view === 'all');
        this.elements.viewStarred.classList.toggle('active', view === 'starred');

        await this.renderArticles();
    }

    // Handle refresh all
    async handleRefreshAll() {
        await feedsManager.updateAllFeeds();
        await this.renderFeeds();
        await this.renderArticles();
    }

    // Handle delete feed
    async handleDeleteFeed(feedId) {
        if (confirm('确定要删除这个订阅源吗？')) {
            await feedsManager.deleteFeed(feedId);
            
            // If current feed is deleted, reset filter
            if (articlesManager.getFeedFilter() === feedId) {
                articlesManager.setFeedFilter(null);
                this.elements.sectionTitle.textContent = '所有文章';
            }
            
            await this.renderFeeds();
            await this.renderArticles();
        }
    }

    // Modal management
    openAddFeedModal() {
        this.elements.addFeedModal.classList.remove('hidden');
        this.elements.modalOverlay.classList.remove('hidden');
        this.elements.feedUrl.value = '';
        this.elements.feedName.value = '';
        this.elements.feedUrl.focus();
    }

    closeAddFeedModal() {
        this.elements.addFeedModal.classList.add('hidden');
        this.elements.modalOverlay.classList.add('hidden');
    }

    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
        this.elements.modalOverlay.classList.add('hidden');
    }

    // Handle add feed
    async handleAddFeed() {
        const url = this.elements.feedUrl.value.trim();
        const name = this.elements.feedName.value.trim();

        if (!url) {
            showToast('请输入 RSS 地址', 'error');
            return;
        }

        try {
            await feedsManager.addFeed(url, name);
            this.closeAddFeedModal();
            await this.renderFeeds();
            await this.renderArticles();
        } catch (error) {
            // Error is already shown in feedsManager
        }
    }

    // Handle mobile navigation
    handleMobileNav(item) {
        const view = item.dataset.view;
        
        document.querySelectorAll('.mobile-nav .nav-item').forEach(nav => {
            nav.classList.remove('active');
        });
        item.classList.add('active');

        if (view === 'feeds') {
            this.elements.sidebar.classList.add('visible');
        } else if (view === 'articles') {
            this.elements.sidebar.classList.remove('visible');
        } else if (view === 'settings') {
            // Open settings modal
            this.elements.settingsModal.classList.remove('hidden');
            this.elements.modalOverlay.classList.remove('hidden');
        }
    }

    // Utility: Escape HTML
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Toast notifications
export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Loading indicator
export function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.remove('hidden');
}

export function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) loading.classList.add('hidden');
}

// Make modal close functions global
window.closeAddFeedModal = () => {
    const modal = document.getElementById('add-feed-modal');
    const overlay = document.getElementById('modal-overlay');
    if (modal) modal.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');
};

window.closeSettingsModal = () => {
    const modal = document.getElementById('settings-modal');
    const overlay = document.getElementById('modal-overlay');
    if (modal) modal.classList.add('hidden');
    if (overlay) overlay.classList.add('hidden');
};

// Create singleton instance
const ui = new UI();

export default ui;

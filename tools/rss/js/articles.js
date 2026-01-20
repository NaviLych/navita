// Articles management module
// Handles article display, reading, and filtering

import db from './db.js';
import feedsManager from './feeds.js';

class ArticlesManager {
    constructor() {
        this.articles = [];
        this.currentArticle = null;
        this.currentView = 'unread'; // 'unread', 'all', 'starred'
        this.currentFeedFilter = null; // null for all feeds, or specific feed ID
    }

    // Initialize articles
    async init() {
        await this.loadArticles();
    }

    // Load articles based on current view and filter
    async loadArticles() {
        try {
            let articles = [];

            // Get articles based on current feed filter
            if (this.currentFeedFilter) {
                articles = await db.getArticlesByFeed(this.currentFeedFilter);
            } else {
                articles = await db.getAllArticles();
            }

            // Apply view filter
            switch (this.currentView) {
                case 'unread':
                    articles = articles.filter(a => !a.read);
                    break;
                case 'starred':
                    articles = articles.filter(a => a.starred);
                    break;
                case 'all':
                default:
                    // Show all articles
                    break;
            }

            // Sort by publication date (newest first)
            articles.sort((a, b) => b.pubDate - a.pubDate);

            this.articles = articles;
            return articles;
        } catch (error) {
            console.error('Error loading articles:', error);
            throw error;
        }
    }

    // Get article by ID
    async getArticle(articleId) {
        return await db.getArticle(articleId);
    }

    // Set current article
    setCurrentArticle(articleId) {
        this.currentArticle = articleId;
    }

    // Get current article
    getCurrentArticle() {
        return this.currentArticle;
    }

    // Set view filter
    setView(view) {
        this.currentView = view;
    }

    // Get current view
    getView() {
        return this.currentView;
    }

    // Set feed filter
    setFeedFilter(feedId) {
        this.currentFeedFilter = feedId;
    }

    // Get current feed filter
    getFeedFilter() {
        return this.currentFeedFilter;
    }

    // Mark article as read
    async markAsRead(articleId, read = true) {
        try {
            await db.markArticleAsRead(articleId, read);
            
            // Update feed unread count
            const article = await db.getArticle(articleId);
            if (article) {
                await feedsManager.updateFeedUnreadCount(article.feedId);
            }

            await this.loadArticles();
        } catch (error) {
            console.error('Error marking article as read:', error);
            throw error;
        }
    }

    // Toggle article star
    async toggleStar(articleId) {
        try {
            await db.toggleArticleStar(articleId);
            await this.loadArticles();
            
            const article = await db.getArticle(articleId);
            return article.starred;
        } catch (error) {
            console.error('Error toggling article star:', error);
            throw error;
        }
    }

    // Get article count for current view
    getArticleCount() {
        return this.articles.length;
    }

    // Get unread count
    async getUnreadCount() {
        const unreadArticles = await db.getUnreadArticles();
        return unreadArticles.length;
    }

    // Get starred count
    async getStarredCount() {
        const starredArticles = await db.getStarredArticles();
        return starredArticles.length;
    }

    // Mark all articles as read
    async markAllAsRead() {
        try {
            const articles = this.currentFeedFilter
                ? await db.getArticlesByFeed(this.currentFeedFilter)
                : await db.getAllArticles();

            for (const article of articles) {
                if (!article.read) {
                    await db.markArticleAsRead(article.id, true);
                }
            }

            // Update feed unread counts
            if (this.currentFeedFilter) {
                await feedsManager.updateFeedUnreadCount(this.currentFeedFilter);
            } else {
                const feeds = await db.getAllFeeds();
                for (const feed of feeds) {
                    await feedsManager.updateFeedUnreadCount(feed.id);
                }
            }

            await this.loadArticles();
        } catch (error) {
            console.error('Error marking all as read:', error);
            throw error;
        }
    }

    // Format date for display
    formatDate(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) {
            return '刚刚';
        } else if (diffMins < 60) {
            return `${diffMins} 分钟前`;
        } else if (diffHours < 24) {
            return `${diffHours} 小时前`;
        } else if (diffDays < 7) {
            return `${diffDays} 天前`;
        } else {
            return date.toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
    }

    // Get feed name for article
    async getFeedName(feedId) {
        const feed = await db.getFeed(feedId);
        return feed ? feed.title : '未知来源';
    }

    // Search articles
    async searchArticles(query) {
        if (!query || query.trim() === '') {
            return this.articles;
        }

        const lowerQuery = query.toLowerCase();
        return this.articles.filter(article => {
            return (
                article.title.toLowerCase().includes(lowerQuery) ||
                article.description.toLowerCase().includes(lowerQuery) ||
                article.content.toLowerCase().includes(lowerQuery)
            );
        });
    }

    // Get article statistics
    async getStats() {
        const allArticles = await db.getAllArticles();
        const unreadArticles = allArticles.filter(a => !a.read);
        const starredArticles = allArticles.filter(a => a.starred);
        const readArticles = allArticles.filter(a => a.read);

        return {
            total: allArticles.length,
            unread: unreadArticles.length,
            starred: starredArticles.length,
            read: readArticles.length
        };
    }
}

// Create singleton instance
const articlesManager = new ArticlesManager();

export default articlesManager;

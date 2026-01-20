// Feeds management module
// Handles feed subscriptions and updates

import db from './db.js';
import rssParser from './rss.js';
import { showToast, showLoading, hideLoading } from './ui.js';

class FeedsManager {
    constructor() {
        this.feeds = [];
        this.currentFeed = null;
    }

    // Initialize feeds
    async init() {
        await this.loadFeeds();
    }

    // Load all feeds from database
    async loadFeeds() {
        try {
            this.feeds = await db.getAllFeeds();
            this.feeds.sort((a, b) => a.title.localeCompare(b.title));
            return this.feeds;
        } catch (error) {
            console.error('Error loading feeds:', error);
            throw error;
        }
    }

    // Add new feed
    async addFeed(url, customName = null) {
        try {
            showLoading();

            // Validate URL
            if (!url || !this.isValidURL(url)) {
                throw new Error('请输入有效的 RSS 地址');
            }

            // Check if feed already exists
            const existingFeeds = await db.getAllFeeds();
            const exists = existingFeeds.some(feed => feed.url === url);
            if (exists) {
                throw new Error('该订阅源已存在');
            }

            // Fetch and parse feed
            const feedData = await rssParser.fetchFeed(url);

            // Create feed object
            const feed = {
                url: url,
                title: customName || feedData.title,
                description: feedData.description,
                link: feedData.link,
                lastUpdated: Date.now(),
                unreadCount: feedData.items.length
            };

            // Save feed to database
            const feedId = await db.addFeed(feed);
            feed.id = feedId;

            // Save articles
            await this.saveArticles(feedId, feedData.items);

            // Reload feeds list
            await this.loadFeeds();

            hideLoading();
            showToast('订阅添加成功！', 'success');

            return feed;
        } catch (error) {
            hideLoading();
            console.error('Error adding feed:', error);
            showToast(error.message || '添加订阅失败', 'error');
            throw error;
        }
    }

    // Update feed articles
    async updateFeed(feedId) {
        try {
            const feed = await db.getFeed(feedId);
            if (!feed) {
                throw new Error('订阅源不存在');
            }

            // Fetch latest articles
            const feedData = await rssParser.fetchFeed(feed.url);

            // Get existing articles
            const existingArticles = await db.getArticlesByFeed(feedId);
            const existingGuids = new Set(existingArticles.map(a => a.guid));

            // Filter new articles
            const newArticles = feedData.items.filter(item => !existingGuids.has(item.guid));

            // Save new articles
            if (newArticles.length > 0) {
                await this.saveArticles(feedId, newArticles);
            }

            // Update feed metadata
            feed.lastUpdated = Date.now();
            feed.unreadCount = (feed.unreadCount || 0) + newArticles.length;
            await db.updateFeed(feed);

            return newArticles.length;
        } catch (error) {
            console.error('Error updating feed:', error);
            throw error;
        }
    }

    // Update all feeds
    async updateAllFeeds() {
        try {
            showLoading();

            let totalNew = 0;
            const feeds = await db.getAllFeeds();

            for (const feed of feeds) {
                try {
                    const newCount = await this.updateFeed(feed.id);
                    totalNew += newCount;
                } catch (error) {
                    console.error(`Error updating feed ${feed.title}:`, error);
                }
            }

            await this.loadFeeds();

            hideLoading();

            if (totalNew > 0) {
                showToast(`更新完成，获取到 ${totalNew} 篇新文章`, 'success');
            } else {
                showToast('已是最新，没有新文章', 'info');
            }

            return totalNew;
        } catch (error) {
            hideLoading();
            console.error('Error updating all feeds:', error);
            showToast('更新失败', 'error');
            throw error;
        }
    }

    // Delete feed
    async deleteFeed(feedId) {
        try {
            await db.deleteFeed(feedId);
            await this.loadFeeds();
            showToast('订阅已删除', 'success');
        } catch (error) {
            console.error('Error deleting feed:', error);
            showToast('删除失败', 'error');
            throw error;
        }
    }

    // Save articles to database
    async saveArticles(feedId, items) {
        for (const item of items) {
            const article = {
                feedId: feedId,
                title: item.title,
                link: item.link,
                description: rssParser.extractPlainText(item.description, 200),
                content: rssParser.sanitizeHTML(item.content),
                pubDate: item.pubDate,
                guid: item.guid,
                author: item.author,
                read: false,
                starred: false
            };

            try {
                await db.addArticle(article);
            } catch (error) {
                // Ignore duplicate entries
                if (!error.message.includes('unique')) {
                    console.error('Error saving article:', error);
                }
            }
        }
    }

    // Get feed by ID
    getFeedById(feedId) {
        return this.feeds.find(feed => feed.id === feedId);
    }

    // Set current feed
    setCurrentFeed(feedId) {
        this.currentFeed = feedId;
    }

    // Get current feed
    getCurrentFeed() {
        return this.currentFeed;
    }

    // Validate URL
    isValidURL(string) {
        try {
            const url = new URL(string);
            return url.protocol === 'http:' || url.protocol === 'https:';
        } catch (_) {
            return false;
        }
    }

    // Get feed count
    getFeedCount() {
        return this.feeds.length;
    }

    // Calculate total unread count
    async getTotalUnreadCount() {
        const unreadArticles = await db.getUnreadArticles();
        return unreadArticles.length;
    }

    // Update feed unread count
    async updateFeedUnreadCount(feedId) {
        const feed = await db.getFeed(feedId);
        if (feed) {
            const articles = await db.getArticlesByFeed(feedId);
            const unreadCount = articles.filter(a => !a.read).length;
            feed.unreadCount = unreadCount;
            await db.updateFeed(feed);
        }
    }
}

// Create singleton instance
const feedsManager = new FeedsManager();

export default feedsManager;

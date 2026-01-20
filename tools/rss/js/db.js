// Database module for RSS Reader
// Handles IndexedDB operations for feeds and articles

const DB_NAME = 'RSSReaderDB';
const DB_VERSION = 1;

class Database {
    constructor() {
        this.db = null;
    }

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Feeds store
                if (!db.objectStoreNames.contains('feeds')) {
                    const feedStore = db.createObjectStore('feeds', { keyPath: 'id', autoIncrement: true });
                    feedStore.createIndex('url', 'url', { unique: true });
                    feedStore.createIndex('title', 'title', { unique: false });
                }

                // Articles store
                if (!db.objectStoreNames.contains('articles')) {
                    const articleStore = db.createObjectStore('articles', { keyPath: 'id', autoIncrement: true });
                    articleStore.createIndex('feedId', 'feedId', { unique: false });
                    articleStore.createIndex('guid', 'guid', { unique: true });
                    articleStore.createIndex('pubDate', 'pubDate', { unique: false });
                    articleStore.createIndex('read', 'read', { unique: false });
                    articleStore.createIndex('starred', 'starred', { unique: false });
                }

                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    // Generic get operation
    async get(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic getAll operation
    async getAll(storeName, indexName = null, query = null) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const source = indexName ? store.index(indexName) : store;
            const request = query ? source.getAll(query) : source.getAll();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic add operation
    async add(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic put operation (update or insert)
    async put(storeName, data) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Generic delete operation
    async delete(storeName, key) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Clear all data from a store
    async clear(storeName) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // Feed-specific operations
    async addFeed(feed) {
        return this.add('feeds', feed);
    }

    async getFeed(id) {
        return this.get('feeds', id);
    }

    async getAllFeeds() {
        return this.getAll('feeds');
    }

    async updateFeed(feed) {
        return this.put('feeds', feed);
    }

    async deleteFeed(id) {
        // Delete feed and all its articles
        const articles = await this.getArticlesByFeed(id);
        for (const article of articles) {
            await this.delete('articles', article.id);
        }
        return this.delete('feeds', id);
    }

    // Article-specific operations
    async addArticle(article) {
        return this.add('articles', article);
    }

    async getArticle(id) {
        return this.get('articles', id);
    }

    async getAllArticles() {
        return this.getAll('articles');
    }

    async getArticlesByFeed(feedId) {
        return this.getAll('articles', 'feedId', feedId);
    }

    async getUnreadArticles() {
        return this.getAll('articles', 'read', false);
    }

    async getStarredArticles() {
        return this.getAll('articles', 'starred', true);
    }

    async updateArticle(article) {
        return this.put('articles', article);
    }

    async deleteArticle(id) {
        return this.delete('articles', id);
    }

    async markArticleAsRead(id, read = true) {
        const article = await this.getArticle(id);
        if (article) {
            article.read = read;
            return this.updateArticle(article);
        }
    }

    async toggleArticleStar(id) {
        const article = await this.getArticle(id);
        if (article) {
            article.starred = !article.starred;
            return this.updateArticle(article);
        }
    }

    // Settings operations
    async getSetting(key) {
        return this.get('settings', key);
    }

    async setSetting(key, value) {
        return this.put('settings', { key, value });
    }

    // Export/Import operations
    async exportData() {
        const feeds = await this.getAllFeeds();
        const articles = await this.getAllArticles();
        const settings = await this.getAll('settings');

        return {
            version: DB_VERSION,
            timestamp: Date.now(),
            feeds,
            articles,
            settings
        };
    }

    async importData(data) {
        // Clear existing data
        await this.clear('feeds');
        await this.clear('articles');
        await this.clear('settings');

        // Import feeds
        for (const feed of data.feeds || []) {
            const { id, ...feedData } = feed;
            await this.add('feeds', feedData);
        }

        // Import articles
        for (const article of data.articles || []) {
            const { id, ...articleData } = article;
            await this.add('articles', articleData);
        }

        // Import settings
        for (const setting of data.settings || []) {
            await this.put('settings', setting);
        }
    }

    // Clear all data
    async clearAllData() {
        await this.clear('feeds');
        await this.clear('articles');
        await this.clear('settings');
    }
}

// Create singleton instance
const db = new Database();

export default db;

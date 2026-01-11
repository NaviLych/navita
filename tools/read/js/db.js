// IndexedDB layer - Native implementation
let indexedDB = null;
const DB_NAME = 'ReadLaterDB';
const DB_VERSION = 1;

// Initialize IndexedDB
function initDB() {
    return new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            indexedDB = request.result;
            resolve(indexedDB);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            // Create object stores
            if (!db.objectStoreNames.contains('articles')) {
                const articles = db.createObjectStore('articles', { keyPath: 'id', autoIncrement: true });
                articles.createIndex('url', 'url', { unique: true });
                articles.createIndex('domain', 'domain');
                articles.createIndex('createdAt', 'createdAt');
            }
            
            if (!db.objectStoreNames.contains('readLaterItems')) {
                const items = db.createObjectStore('readLaterItems', { keyPath: 'id', autoIncrement: true });
                items.createIndex('articleId', 'articleId');
                items.createIndex('status', 'status');
                items.createIndex('starred', 'starred');
                items.createIndex('updatedAt', 'updatedAt');
            }
            
            if (!db.objectStoreNames.contains('notes')) {
                const notes = db.createObjectStore('notes', { keyPath: 'id', autoIncrement: true });
                notes.createIndex('articleId', 'articleId');
                notes.createIndex('createdAt', 'createdAt');
            }
            
            if (!db.objectStoreNames.contains('checkins')) {
                const checkins = db.createObjectStore('checkins', { keyPath: 'id', autoIncrement: true });
                checkins.createIndex('date', 'date', { unique: true });
                checkins.createIndex('createdAt', 'createdAt');
            }
            
            if (!db.objectStoreNames.contains('pointsTransactions')) {
                const transactions = db.createObjectStore('pointsTransactions', { keyPath: 'id', autoIncrement: true });
                transactions.createIndex('createdAt', 'createdAt');
            }
            
            if (!db.objectStoreNames.contains('settings')) {
                db.createObjectStore('settings', { keyPath: 'id' });
            }
            
            if (!db.objectStoreNames.contains('recommendationFeedback')) {
                const feedback = db.createObjectStore('recommendationFeedback', { keyPath: 'id', autoIncrement: true });
                feedback.createIndex('articleId', 'articleId');
                feedback.createIndex('type', 'type');
                feedback.createIndex('createdAt', 'createdAt');
            }
        };
    });
}

// Helper functions
function promisifyRequest(request) {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

function getAll(storeName, indexName = null, query = null) {
    return new Promise((resolve, reject) => {
        const transaction = indexedDB.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const source = indexName ? store.index(indexName) : store;
        const request = query ? source.getAll(query) : source.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Database operations
class Database {
    constructor() {
        this.ready = initDB();
    }

    async ensureReady() {
        await this.ready;
    }

    // Articles
    async addArticle(articleData) {
        await this.ensureReady();
        
        // Check if exists
        const existing = await this.getArticleByUrl(articleData.url);
        if (existing) {
            return existing;
        }
        
        return new Promise((resolve, reject) => {
            const transaction = indexedDB.transaction(['articles'], 'readwrite');
            const store = transaction.objectStore('articles');
            const data = {
                ...articleData,
                createdAt: new Date().toISOString()
            };
            const request = store.add(data);
            
            request.onsuccess = async () => {
                const article = await this.getArticle(request.result);
                resolve(article);
            };
            request.onerror = () => reject(request.error);
        });
    }

    async getArticle(id) {
        await this.ensureReady();
        const transaction = indexedDB.transaction(['articles'], 'readonly');
        const store = transaction.objectStore('articles');
        return promisifyRequest(store.get(id));
    }

    async getArticleByUrl(url) {
        await this.ensureReady();
        const transaction = indexedDB.transaction(['articles'], 'readonly');
        const store = transaction.objectStore('articles');
        const index = store.index('url');
        return promisifyRequest(index.get(url));
    }

    async updateArticle(id, data) {
        await this.ensureReady();
        const article = await this.getArticle(id);
        const updated = { ...article, ...data };
        
        const transaction = indexedDB.transaction(['articles'], 'readwrite');
        const store = transaction.objectStore('articles');
        await promisifyRequest(store.put(updated));
        return updated;
    }

    async deleteArticle(id) {
        await this.ensureReady();
        const transaction = indexedDB.transaction(['articles'], 'readwrite');
        const store = transaction.objectStore('articles');
        return promisifyRequest(store.delete(id));
    }

    async searchArticles(query) {
        await this.ensureReady();
        const articles = await getAll('articles');
        const lowerQuery = query.toLowerCase();
        return articles.filter(article => 
            article.title?.toLowerCase().includes(lowerQuery) ||
            article.excerpt?.toLowerCase().includes(lowerQuery) ||
            article.domain?.toLowerCase().includes(lowerQuery)
        );
    }

    // Read Later Items
    async addReadLaterItem(itemData) {
        await this.ensureReady();
        const transaction = indexedDB.transaction(['readLaterItems'], 'readwrite');
        const store = transaction.objectStore('readLaterItems');
        const data = {
            ...itemData,
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: itemData.status || 'unread',
            progress: itemData.progress || 0,
            notesCount: 0,
            tags: itemData.tags || [],
            starred: itemData.starred || false
        };
        const id = await promisifyRequest(store.add(data));
        return await this.getReadLaterItem(id);
    }

    async getReadLaterItem(id) {
        await this.ensureReady();
        const transaction = indexedDB.transaction(['readLaterItems'], 'readonly');
        const store = transaction.objectStore('readLaterItems');
        return promisifyRequest(store.get(id));
    }

    async getReadLaterItemByArticleId(articleId) {
        await this.ensureReady();
        const items = await getAll('readLaterItems');
        return items.find(item => item.articleId === articleId);
    }

    async updateReadLaterItem(id, data) {
        await this.ensureReady();
        const item = await this.getReadLaterItem(id);
        const updated = {
            ...item,
            ...data,
            updatedAt: new Date().toISOString()
        };
        
        const transaction = indexedDB.transaction(['readLaterItems'], 'readwrite');
        const store = transaction.objectStore('readLaterItems');
        await promisifyRequest(store.put(updated));
        return updated;
    }

    async deleteReadLaterItem(id) {
        await this.ensureReady();
        const transaction = indexedDB.transaction(['readLaterItems'], 'readwrite');
        const store = transaction.objectStore('readLaterItems');
        return promisifyRequest(store.delete(id));
    }

    async getReadLaterItems(filter = {}) {
        await this.ensureReady();
        let items = await getAll('readLaterItems');
        
        if (filter.status) {
            items = items.filter(item => item.status === filter.status);
        }
        
        if (filter.starred) {
            items = items.filter(item => item.starred === true);
        }
        
        if (filter.tags && filter.tags.length > 0) {
            items = items.filter(item => 
                filter.tags.some(tag => item.tags && item.tags.includes(tag))
            );
        }
        
        // Sort by updatedAt descending
        items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        return items;
    }

    async getAllTags() {
        await this.ensureReady();
        const items = await getAll('readLaterItems');
        const tagsSet = new Set();
        items.forEach(item => {
            if (item.tags) {
                item.tags.forEach(tag => tagsSet.add(tag));
            }
        });
        return Array.from(tagsSet);
    }

    // Notes
    async addNote(noteData) {
        await this.ensureReady();
        const transaction = indexedDB.transaction(['notes', 'readLaterItems'], 'readwrite');
        const noteStore = transaction.objectStore('notes');
        const data = {
            ...noteData,
            createdAt: new Date().toISOString()
        };
        const id = await promisifyRequest(noteStore.add(data));
        
        // Update notes count
        const item = await this.getReadLaterItemByArticleId(noteData.articleId);
        if (item) {
            await this.updateReadLaterItem(item.id, {
                notesCount: (item.notesCount || 0) + 1
            });
        }
        
        return await this.getNote(id);
    }

    async getNote(id) {
        await this.ensureReady();
        const transaction = indexedDB.transaction(['notes'], 'readonly');
        const store = transaction.objectStore('notes');
        return promisifyRequest(store.get(id));
    }

    async getNotesByArticleId(articleId) {
        await this.ensureReady();
        const notes = await getAll('notes');
        return notes.filter(note => note.articleId === articleId)
                   .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    async updateNote(id, data) {
        await this.ensureReady();
        const note = await this.getNote(id);
        const updated = { ...note, ...data };
        
        const transaction = indexedDB.transaction(['notes'], 'readwrite');
        const store = transaction.objectStore('notes');
        await promisifyRequest(store.put(updated));
        return updated;
    }

    async deleteNote(id) {
        await this.ensureReady();
        const note = await this.getNote(id);
        
        const transaction = indexedDB.transaction(['notes'], 'readwrite');
        const store = transaction.objectStore('notes');
        await promisifyRequest(store.delete(id));
        
        // Update notes count
        const item = await this.getReadLaterItemByArticleId(note.articleId);
        if (item) {
            await this.updateReadLaterItem(item.id, {
                notesCount: Math.max(0, (item.notesCount || 0) - 1)
            });
        }
    }

    // Checkins
    async addCheckin(date = null) {
        await this.ensureReady();
        const checkinDate = date || new Date().toISOString().split('T')[0];
        
        // Check if already checked in
        const existing = await this.getCheckin(checkinDate);
        if (existing) {
            return { success: false, message: '今天已经签到过了', checkin: existing };
        }
        
        const transaction = indexedDB.transaction(['checkins', 'pointsTransactions'], 'readwrite');
        const checkinStore = transaction.objectStore('checkins');
        const data = {
            date: checkinDate,
            rewardPoints: 10,
            type: 'daily',
            createdAt: new Date().toISOString()
        };
        const id = await promisifyRequest(checkinStore.add(data));
        
        // Add points transaction
        await this.addPointsTransaction(10, 'checkin');
        
        // Check for consecutive bonus
        const consecutiveDays = await this.getConsecutiveCheckinDays();
        if (consecutiveDays % 7 === 0 && consecutiveDays > 0) {
            await this.addPointsTransaction(50, 'checkin_bonus');
        }
        
        const checkin = await this.getCheckinById(id);
        return { success: true, checkin, consecutiveDays };
    }

    async getCheckinById(id) {
        await this.ensureReady();
        const transaction = indexedDB.transaction(['checkins'], 'readonly');
        const store = transaction.objectStore('checkins');
        return promisifyRequest(store.get(id));
    }

    async getCheckin(date) {
        await this.ensureReady();
        const checkins = await getAll('checkins');
        return checkins.find(c => c.date === date);
    }

    async getCheckins(startDate, endDate) {
        await this.ensureReady();
        const checkins = await getAll('checkins');
        return checkins.filter(c => c.date >= startDate && c.date <= endDate);
    }

    async getConsecutiveCheckinDays() {
        await this.ensureReady();
        const checkins = await getAll('checkins');
        checkins.sort((a, b) => b.date.localeCompare(a.date));
        
        if (checkins.length === 0) return 0;
        
        let consecutive = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        for (const checkin of checkins) {
            const checkinDate = new Date(checkin.date);
            const diffDays = Math.floor((currentDate - checkinDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === consecutive) {
                consecutive++;
            } else {
                break;
            }
        }
        
        return consecutive;
    }

    async getAllCheckins() {
        await this.ensureReady();
        const checkins = await getAll('checkins');
        return checkins.sort((a, b) => b.date.localeCompare(a.date));
    }

    // Points Transactions
    async addPointsTransaction(delta, reason) {
        await this.ensureReady();
        const transaction = indexedDB.transaction(['pointsTransactions'], 'readwrite');
        const store = transaction.objectStore('pointsTransactions');
        const data = {
            delta,
            reason,
            createdAt: new Date().toISOString()
        };
        const id = await promisifyRequest(store.add(data));
        
        const txStore = indexedDB.transaction(['pointsTransactions'], 'readonly').objectStore('pointsTransactions');
        return promisifyRequest(txStore.get(id));
    }

    async getTotalPoints() {
        await this.ensureReady();
        const transactions = await getAll('pointsTransactions');
        return transactions.reduce((sum, t) => sum + t.delta, 0);
    }

    async getPointsTransactions(limit = 50) {
        await this.ensureReady();
        const transactions = await getAll('pointsTransactions');
        return transactions
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .slice(0, limit);
    }

    // Settings
    async getSettings() {
        await this.ensureReady();
        const transaction = indexedDB.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');
        let settings = await promisifyRequest(store.get('default'));
        
        if (!settings) {
            settings = {
                id: 'default',
                theme: 'light',
                fontSize: 16,
                lineHeight: 1.8,
                remindersEnabled: false
            };
            await this.updateSettings(settings);
        }
        return settings;
    }

    async updateSettings(data) {
        await this.ensureReady();
        const transaction = indexedDB.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');
        const settings = { id: 'default', ...data };
        await promisifyRequest(store.put(settings));
        return settings;
    }

    // Recommendation Feedback
    async addRecommendationFeedback(articleId, type) {
        await this.ensureReady();
        const transaction = indexedDB.transaction(['recommendationFeedback'], 'readwrite');
        const store = transaction.objectStore('recommendationFeedback');
        const data = {
            articleId,
            type,
            createdAt: new Date().toISOString()
        };
        const id = await promisifyRequest(store.add(data));
        
        const fbStore = indexedDB.transaction(['recommendationFeedback'], 'readonly').objectStore('recommendationFeedback');
        return promisifyRequest(fbStore.get(id));
    }

    async getRecommendationFeedback() {
        await this.ensureReady();
        return await getAll('recommendationFeedback');
    }

    // Backup and restore
    async exportData() {
        await this.ensureReady();
        const data = {
            version: 1,
            exportDate: new Date().toISOString(),
            articles: await getAll('articles'),
            readLaterItems: await getAll('readLaterItems'),
            notes: await getAll('notes'),
            checkins: await getAll('checkins'),
            pointsTransactions: await getAll('pointsTransactions'),
            settings: await getAll('settings'),
            recommendationFeedback: await getAll('recommendationFeedback')
        };
        return data;
    }

    async importData(data, mode = 'merge') {
        await this.ensureReady();
        
        if (mode === 'overwrite') {
            await this.clearAllData();
        }
        
        // Import with deduplication
        const urlsMap = new Map();
        if (mode === 'merge') {
            const existing = await getAll('articles');
            existing.forEach(a => urlsMap.set(a.url, a.id));
        }
        
        // Import articles
        for (const article of data.articles || []) {
            if (!urlsMap.has(article.url)) {
                const { id, ...articleData } = article;
                await this.addArticle(articleData);
            }
        }
        
        // Import other data
        const transaction = indexedDB.transaction([
            'readLaterItems', 'notes', 'checkins', 'pointsTransactions', 'settings', 'recommendationFeedback'
        ], 'readwrite');
        
        if (data.readLaterItems) {
            const store = transaction.objectStore('readLaterItems');
            for (const item of data.readLaterItems) {
                const { id, ...itemData } = item;
                store.add(itemData);
            }
        }
        
        if (data.notes) {
            const store = transaction.objectStore('notes');
            for (const note of data.notes) {
                const { id, ...noteData } = note;
                store.add(noteData);
            }
        }
        
        if (data.checkins) {
            const store = transaction.objectStore('checkins');
            for (const checkin of data.checkins) {
                const { id, ...checkinData } = checkin;
                const existing = await this.getCheckin(checkinData.date);
                if (!existing) {
                    store.add(checkinData);
                }
            }
        }
        
        if (data.pointsTransactions) {
            const store = transaction.objectStore('pointsTransactions');
            for (const tx of data.pointsTransactions) {
                const { id, ...txData } = tx;
                store.add(txData);
            }
        }
        
        if (data.settings && data.settings.length > 0) {
            const store = transaction.objectStore('settings');
            store.put(data.settings[0]);
        }
        
        if (data.recommendationFeedback) {
            const store = transaction.objectStore('recommendationFeedback');
            for (const fb of data.recommendationFeedback) {
                const { id, ...fbData } = fb;
                store.add(fbData);
            }
        }
        
        return promisifyRequest(transaction);
    }

    async clearAllData() {
        await this.ensureReady();
        const storeNames = ['articles', 'readLaterItems', 'notes', 'checkins', 'pointsTransactions', 'recommendationFeedback'];
        const transaction = indexedDB.transaction(storeNames, 'readwrite');
        
        for (const storeName of storeNames) {
            const store = transaction.objectStore(storeName);
            store.clear();
        }
        
        return promisifyRequest(transaction);
    }

    // Stats
    async getStats() {
        await this.ensureReady();
        const readLaterItems = await getAll('readLaterItems');
        const completedItems = readLaterItems.filter(item => item.status === 'done');
        const totalPoints = await this.getTotalPoints();
        const consecutiveDays = await this.getConsecutiveCheckinDays();
        
        // Calculate reading time (estimate based on articles read)
        const estimatedReadingMinutes = completedItems.reduce((sum, item) => {
            return sum + 5; // 5 minutes per article average
        }, 0);
        
        return {
            totalArticles: readLaterItems.length,
            completedArticles: completedItems.length,
            readingMinutes: estimatedReadingMinutes,
            consecutiveDays,
            totalPoints,
            unreadCount: readLaterItems.filter(item => item.status === 'unread').length,
            readingCount: readLaterItems.filter(item => item.status === 'reading').length,
            starredCount: readLaterItems.filter(item => item.starred).length
        };
    }

    // db property for compatibility
    get db() {
        return {
            articles: { toArray: () => getAll('articles'), where: () => ({ equals: () => ({}) }) },
            readLaterItems: { toArray: () => getAll('readLaterItems'), where: () => ({ between: () => ({ toArray: () => getAll('readLaterItems') }) }) },
            notes: { toArray: () => getAll('notes') },
            checkins: { toArray: () => getAll('checkins'), orderBy: () => ({ reverse: () => ({ toArray: () => this.getAllCheckins() }) }) },
            pointsTransactions: { toArray: () => getAll('pointsTransactions'), where: () => ({ between: () => ({ toArray: () => getAll('pointsTransactions') }) }) },
            settings: { toArray: () => getAll('settings') },
            recommendationFeedback: { toArray: () => getAll('recommendationFeedback'), where: () => ({ equals: () => ({ toArray: () => getAll('recommendationFeedback') }) }), delete: (id) => this.deleteRecommendationFeedback(id), clear: () => this.clearRecommendationFeedback() }
        };
    }

    async deleteRecommendationFeedback(id) {
        await this.ensureReady();
        const transaction = indexedDB.transaction(['recommendationFeedback'], 'readwrite');
        const store = transaction.objectStore('recommendationFeedback');
        return promisifyRequest(store.delete(id));
    }

    async clearRecommendationFeedback() {
        await this.ensureReady();
        const transaction = indexedDB.transaction(['recommendationFeedback'], 'readwrite');
        const store = transaction.objectStore('recommendationFeedback');
        return promisifyRequest(store.clear());
    }
}

// Create singleton instance
const database = new Database();

export default database;
export { database };

// IndexedDB layer using Dexie.js
const db = new Dexie('ReadLaterDB');

// Define database schema
db.version(1).stores({
    articles: '++id, url, domain, createdAt',
    readLaterItems: '++id, articleId, status, *tags, starred, updatedAt',
    notes: '++id, articleId, createdAt',
    checkins: '++id, &date, createdAt',
    pointsTransactions: '++id, createdAt',
    settings: '&id',
    recommendationFeedback: '++id, articleId, type, createdAt'
});

// Database operations
class Database {
    // Articles
    async addArticle(articleData) {
        const existing = await db.articles.where('url').equals(articleData.url).first();
        if (existing) {
            return existing;
        }
        const id = await db.articles.add({
            ...articleData,
            createdAt: new Date().toISOString()
        });
        return await db.articles.get(id);
    }

    async getArticle(id) {
        return await db.articles.get(id);
    }

    async getArticleByUrl(url) {
        return await db.articles.where('url').equals(url).first();
    }

    async updateArticle(id, data) {
        await db.articles.update(id, data);
        return await db.articles.get(id);
    }

    async deleteArticle(id) {
        await db.articles.delete(id);
    }

    async searchArticles(query) {
        const articles = await db.articles.toArray();
        const lowerQuery = query.toLowerCase();
        return articles.filter(article => 
            article.title?.toLowerCase().includes(lowerQuery) ||
            article.excerpt?.toLowerCase().includes(lowerQuery) ||
            article.domain?.toLowerCase().includes(lowerQuery)
        );
    }

    // Read Later Items
    async addReadLaterItem(itemData) {
        const id = await db.readLaterItems.add({
            ...itemData,
            addedAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: itemData.status || 'unread',
            progress: itemData.progress || 0,
            notesCount: 0,
            tags: itemData.tags || [],
            starred: itemData.starred || false
        });
        return await db.readLaterItems.get(id);
    }

    async getReadLaterItem(id) {
        return await db.readLaterItems.get(id);
    }

    async getReadLaterItemByArticleId(articleId) {
        return await db.readLaterItems.where('articleId').equals(articleId).first();
    }

    async updateReadLaterItem(id, data) {
        await db.readLaterItems.update(id, {
            ...data,
            updatedAt: new Date().toISOString()
        });
        return await db.readLaterItems.get(id);
    }

    async deleteReadLaterItem(id) {
        await db.readLaterItems.delete(id);
    }

    async getReadLaterItems(filter = {}) {
        let query = db.readLaterItems;
        
        if (filter.status) {
            query = query.where('status').equals(filter.status);
        }
        
        if (filter.starred) {
            query = query.filter(item => item.starred === true);
        }
        
        if (filter.tags && filter.tags.length > 0) {
            query = query.filter(item => 
                filter.tags.some(tag => item.tags.includes(tag))
            );
        }
        
        let items = await query.toArray();
        
        // Sort by updatedAt descending
        items.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        return items;
    }

    async getAllTags() {
        const items = await db.readLaterItems.toArray();
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
        const id = await db.notes.add({
            ...noteData,
            createdAt: new Date().toISOString()
        });
        
        // Update notes count in read later item
        const item = await this.getReadLaterItemByArticleId(noteData.articleId);
        if (item) {
            await this.updateReadLaterItem(item.id, {
                notesCount: (item.notesCount || 0) + 1
            });
        }
        
        return await db.notes.get(id);
    }

    async getNotesByArticleId(articleId) {
        return await db.notes.where('articleId').equals(articleId).sortBy('createdAt');
    }

    async updateNote(id, data) {
        await db.notes.update(id, data);
        return await db.notes.get(id);
    }

    async deleteNote(id) {
        const note = await db.notes.get(id);
        await db.notes.delete(id);
        
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
        const checkinDate = date || new Date().toISOString().split('T')[0];
        
        // Check if already checked in today
        const existing = await db.checkins.where('date').equals(checkinDate).first();
        if (existing) {
            return { success: false, message: '今天已经签到过了', checkin: existing };
        }
        
        const id = await db.checkins.add({
            date: checkinDate,
            rewardPoints: 10,
            type: 'daily',
            createdAt: new Date().toISOString()
        });
        
        // Add points transaction
        await this.addPointsTransaction(10, 'checkin');
        
        // Check for consecutive bonus
        const consecutiveDays = await this.getConsecutiveCheckinDays();
        if (consecutiveDays % 7 === 0 && consecutiveDays > 0) {
            await this.addPointsTransaction(50, 'checkin_bonus');
        }
        
        return { success: true, checkin: await db.checkins.get(id), consecutiveDays };
    }

    async getCheckin(date) {
        return await db.checkins.where('date').equals(date).first();
    }

    async getCheckins(startDate, endDate) {
        return await db.checkins
            .where('date')
            .between(startDate, endDate, true, true)
            .toArray();
    }

    async getConsecutiveCheckinDays() {
        const checkins = await db.checkins.orderBy('date').reverse().toArray();
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
        return await db.checkins.orderBy('date').reverse().toArray();
    }

    // Points Transactions
    async addPointsTransaction(delta, reason) {
        const id = await db.pointsTransactions.add({
            delta,
            reason,
            createdAt: new Date().toISOString()
        });
        return await db.pointsTransactions.get(id);
    }

    async getTotalPoints() {
        const transactions = await db.pointsTransactions.toArray();
        return transactions.reduce((sum, t) => sum + t.delta, 0);
    }

    async getPointsTransactions(limit = 50) {
        return await db.pointsTransactions
            .orderBy('createdAt')
            .reverse()
            .limit(limit)
            .toArray();
    }

    // Settings
    async getSettings() {
        let settings = await db.settings.get('default');
        if (!settings) {
            settings = {
                id: 'default',
                theme: 'light',
                fontSize: 16,
                lineHeight: 1.8,
                remindersEnabled: false
            };
            await db.settings.put(settings);
        }
        return settings;
    }

    async updateSettings(data) {
        await db.settings.put({ id: 'default', ...data });
        return await this.getSettings();
    }

    // Recommendation Feedback
    async addRecommendationFeedback(articleId, type) {
        const id = await db.recommendationFeedback.add({
            articleId,
            type,
            createdAt: new Date().toISOString()
        });
        return await db.recommendationFeedback.get(id);
    }

    async getRecommendationFeedback() {
        return await db.recommendationFeedback.toArray();
    }

    // Backup and restore
    async exportData() {
        const data = {
            version: 1,
            exportDate: new Date().toISOString(),
            articles: await db.articles.toArray(),
            readLaterItems: await db.readLaterItems.toArray(),
            notes: await db.notes.toArray(),
            checkins: await db.checkins.toArray(),
            pointsTransactions: await db.pointsTransactions.toArray(),
            settings: await db.settings.toArray(),
            recommendationFeedback: await db.recommendationFeedback.toArray()
        };
        return data;
    }

    async importData(data, mode = 'merge') {
        if (mode === 'overwrite') {
            await this.clearAllData();
        }
        
        // Import with deduplication
        const urlsMap = new Map();
        if (mode === 'merge') {
            const existing = await db.articles.toArray();
            existing.forEach(a => urlsMap.set(a.url, a.id));
        }
        
        // Import articles
        for (const article of data.articles || []) {
            if (!urlsMap.has(article.url)) {
                const { id, ...articleData } = article;
                await db.articles.add(articleData);
            }
        }
        
        // Import other data
        if (data.readLaterItems) {
            await db.readLaterItems.bulkAdd(data.readLaterItems.map(({ id, ...item }) => item));
        }
        if (data.notes) {
            await db.notes.bulkAdd(data.notes.map(({ id, ...note }) => note));
        }
        if (data.checkins) {
            for (const checkin of data.checkins) {
                const { id, ...checkinData } = checkin;
                const existing = await db.checkins.where('date').equals(checkinData.date).first();
                if (!existing) {
                    await db.checkins.add(checkinData);
                }
            }
        }
        if (data.pointsTransactions) {
            await db.pointsTransactions.bulkAdd(data.pointsTransactions.map(({ id, ...t }) => t));
        }
        if (data.settings && data.settings.length > 0) {
            await db.settings.put(data.settings[0]);
        }
        if (data.recommendationFeedback) {
            await db.recommendationFeedback.bulkAdd(data.recommendationFeedback.map(({ id, ...f }) => f));
        }
    }

    async clearAllData() {
        await db.articles.clear();
        await db.readLaterItems.clear();
        await db.notes.clear();
        await db.checkins.clear();
        await db.pointsTransactions.clear();
        await db.recommendationFeedback.clear();
    }

    // Stats
    async getStats() {
        const readLaterItems = await db.readLaterItems.toArray();
        const completedItems = readLaterItems.filter(item => item.status === 'done');
        const totalPoints = await this.getTotalPoints();
        const consecutiveDays = await this.getConsecutiveCheckinDays();
        
        // Calculate reading time (estimate based on articles read)
        const estimatedReadingMinutes = completedItems.reduce((sum, item) => {
            // Estimate 5 minutes per article if not tracked
            return sum + 5;
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
}

// Create singleton instance
const database = new Database();

export default database;
export { db, database };

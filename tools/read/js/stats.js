// Statistics module
import database from './db.js';

class StatsManager {
    async getStats() {
        return await database.getStats();
    }

    async getDetailedStats() {
        const basicStats = await database.getStats();
        const allItems = await database.getReadLaterItems();
        const allCheckins = await database.getAllCheckins();
        const allTags = await database.getAllTags();
        
        // Calculate additional metrics
        const tagStats = await this.getTagStats(allItems);
        const domainStats = await this.getDomainStats(allItems);
        const monthlyStats = await this.getMonthlyStats(allItems);
        const completionRate = basicStats.totalArticles > 0 
            ? (basicStats.completedArticles / basicStats.totalArticles * 100).toFixed(1)
            : 0;
        
        return {
            ...basicStats,
            completionRate,
            totalTags: allTags.length,
            totalCheckins: allCheckins.length,
            tagStats,
            domainStats,
            monthlyStats
        };
    }

    async getTagStats(items) {
        const tagCounts = new Map();
        
        items.forEach(item => {
            item.tags?.forEach(tag => {
                if (!tagCounts.has(tag)) {
                    tagCounts.set(tag, { total: 0, completed: 0 });
                }
                const stats = tagCounts.get(tag);
                stats.total++;
                if (item.status === 'done') {
                    stats.completed++;
                }
            });
        });
        
        return Array.from(tagCounts.entries())
            .map(([tag, stats]) => ({
                tag,
                ...stats,
                completionRate: stats.total > 0 
                    ? (stats.completed / stats.total * 100).toFixed(1)
                    : 0
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }

    async getDomainStats(items) {
        const domainCounts = new Map();
        
        for (const item of items) {
            const article = await database.getArticle(item.articleId);
            if (article && article.domain) {
                if (!domainCounts.has(article.domain)) {
                    domainCounts.set(article.domain, { total: 0, completed: 0 });
                }
                const stats = domainCounts.get(article.domain);
                stats.total++;
                if (item.status === 'done') {
                    stats.completed++;
                }
            }
        }
        
        return Array.from(domainCounts.entries())
            .map(([domain, stats]) => ({
                domain,
                ...stats,
                completionRate: stats.total > 0 
                    ? (stats.completed / stats.total * 100).toFixed(1)
                    : 0
            }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }

    async getMonthlyStats(items) {
        const monthlyData = new Map();
        
        items.forEach(item => {
            const month = item.addedAt.substring(0, 7); // YYYY-MM
            if (!monthlyData.has(month)) {
                monthlyData.set(month, { added: 0, completed: 0 });
            }
            monthlyData.get(month).added++;
        });
        
        items.filter(item => item.status === 'done').forEach(item => {
            const month = item.updatedAt.substring(0, 7);
            if (monthlyData.has(month)) {
                monthlyData.get(month).completed++;
            }
        });
        
        return Array.from(monthlyData.entries())
            .map(([month, stats]) => ({ month, ...stats }))
            .sort((a, b) => b.month.localeCompare(a.month))
            .slice(0, 12);
    }

    async getReadingStreak() {
        const allItems = await database.getReadLaterItems({ status: 'done' });
        
        if (allItems.length === 0) return 0;
        
        // Sort by completion date
        const sorted = allItems.sort((a, b) => 
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        
        let streak = 0;
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        for (const item of sorted) {
            const itemDate = new Date(item.updatedAt);
            itemDate.setHours(0, 0, 0, 0);
            
            const diffDays = Math.floor((currentDate - itemDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays === streak) {
                streak++;
            } else if (diffDays > streak) {
                break;
            }
        }
        
        return streak;
    }

    async getAchievements() {
        const stats = await this.getStats();
        const consecutiveDays = stats.consecutiveDays;
        const achievements = [];
        
        // Checkin achievements
        if (consecutiveDays >= 7) {
            achievements.push({
                id: 'checkin_7',
                title: '坚持一周',
                description: '连续签到7天',
                icon: '🔥',
                unlocked: true
            });
        }
        
        if (consecutiveDays >= 30) {
            achievements.push({
                id: 'checkin_30',
                title: '坚持一月',
                description: '连续签到30天',
                icon: '💪',
                unlocked: true
            });
        }
        
        if (consecutiveDays >= 100) {
            achievements.push({
                id: 'checkin_100',
                title: '百日坚持',
                description: '连续签到100天',
                icon: '🏆',
                unlocked: true
            });
        }
        
        // Reading achievements
        if (stats.completedArticles >= 10) {
            achievements.push({
                id: 'read_10',
                title: '初读者',
                description: '完成10篇文章',
                icon: '📚',
                unlocked: true
            });
        }
        
        if (stats.completedArticles >= 100) {
            achievements.push({
                id: 'read_100',
                title: '百篇达成',
                description: '完成100篇文章',
                icon: '🎓',
                unlocked: true
            });
        }
        
        if (stats.completedArticles >= 500) {
            achievements.push({
                id: 'read_500',
                title: '阅读大师',
                description: '完成500篇文章',
                icon: '👑',
                unlocked: true
            });
        }
        
        // Points achievements
        if (stats.totalPoints >= 1000) {
            achievements.push({
                id: 'points_1000',
                title: '积分达人',
                description: '累计获得1000积分',
                icon: '💰',
                unlocked: true
            });
        }
        
        return achievements;
    }

    async exportStatsReport() {
        const stats = await this.getDetailedStats();
        const achievements = await this.getAchievements();
        
        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalArticles: stats.totalArticles,
                completedArticles: stats.completedArticles,
                completionRate: stats.completionRate,
                totalPoints: stats.totalPoints,
                consecutiveDays: stats.consecutiveDays,
                readingMinutes: stats.readingMinutes
            },
            tagStats: stats.tagStats,
            domainStats: stats.domainStats,
            monthlyStats: stats.monthlyStats,
            achievements: achievements
        };
        
        return report;
    }
}

const statsManager = new StatsManager();
export default statsManager;
export { statsManager };

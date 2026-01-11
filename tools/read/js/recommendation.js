// Recommendation engine
import database from './db.js';
import UI from './ui.js';

class RecommendationEngine {
    async getRecommendations(limit = 20) {
        try {
            // Get user's read later items to understand preferences
            const readLaterItems = await database.getReadLaterItems();
            
            // Get feedback to filter out blocked content
            const feedback = await database.getRecommendationFeedback();
            const blockedArticleIds = new Set(
                feedback.filter(f => f.type === 'not_interested').map(f => f.articleId)
            );
            const blockedDomains = new Set(
                feedback.filter(f => f.type === 'block_domain').map(f => f.articleId)
            );
            
            // Get articles with their read later status
            const articlePromises = readLaterItems.map(async item => {
                const article = await database.getArticle(item.articleId);
                return { article, item };
            });
            const articlesWithItems = await Promise.all(articlePromises);
            
            // Extract preferences
            const preferences = this.extractPreferences(articlesWithItems);
            
            // Get all articles
            const allArticles = await database.db.articles.toArray();
            
            // Score and filter articles
            const scored = allArticles
                .filter(article => {
                    // Filter out blocked articles
                    if (blockedArticleIds.has(article.id)) return false;
                    
                    // Filter out blocked domains
                    if (blockedDomains.has(article.domain)) return false;
                    
                    // Filter out already in read later
                    const alreadyAdded = readLaterItems.some(item => item.articleId === article.id);
                    if (alreadyAdded) return false;
                    
                    return true;
                })
                .map(article => ({
                    article,
                    score: this.scoreArticle(article, preferences)
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, limit);
            
            return scored.map(s => s.article);
        } catch (error) {
            console.error('Failed to get recommendations:', error);
            return [];
        }
    }

    extractPreferences(articlesWithItems) {
        const tagCounts = new Map();
        const domainCounts = new Map();
        const recentInteractions = [];
        
        // Sort by interaction time (updatedAt or addedAt)
        const sorted = articlesWithItems.sort((a, b) => {
            const dateA = new Date(a.item.updatedAt || a.item.addedAt);
            const dateB = new Date(b.item.updatedAt || b.item.addedAt);
            return dateB - dateA;
        });
        
        // Focus on recent interactions (last 30 items)
        const recent = sorted.slice(0, 30);
        
        recent.forEach(({ article, item }) => {
            // Weight recent interactions higher
            const weight = item.starred ? 3 : item.status === 'done' ? 2 : 1;
            
            // Count tags
            item.tags?.forEach(tag => {
                tagCounts.set(tag, (tagCounts.get(tag) || 0) + weight);
            });
            
            // Count domains
            if (article) {
                domainCounts.set(article.domain, (domainCounts.get(article.domain) || 0) + weight);
            }
        });
        
        return {
            tags: tagCounts,
            domains: domainCounts
        };
    }

    scoreArticle(article, preferences) {
        let score = 0;
        
        // Score based on domain preference
        if (preferences.domains.has(article.domain)) {
            score += preferences.domains.get(article.domain) * 10;
        }
        
        // Score based on recency (prefer newer articles)
        const ageInDays = (Date.now() - new Date(article.createdAt)) / (1000 * 60 * 60 * 24);
        score += Math.max(0, 30 - ageInDays); // Boost recent articles
        
        // Add some randomness to diversify recommendations
        score += Math.random() * 10;
        
        return score;
    }

    async addFeedback(articleId, type) {
        try {
            await database.addRecommendationFeedback(articleId, type);
            
            if (type === 'not_interested') {
                UI.showToast('已标记为不感兴趣', 'success');
            } else if (type === 'block_domain') {
                const article = await database.getArticle(articleId);
                if (article) {
                    UI.showToast(`已屏蔽来源：${article.domain}`, 'success');
                }
            }
        } catch (error) {
            UI.showToast('操作失败: ' + error.message, 'error');
            throw error;
        }
    }

    async getBlockedDomains() {
        const feedback = await database.getRecommendationFeedback();
        const blockedArticleIds = feedback
            .filter(f => f.type === 'block_domain')
            .map(f => f.articleId);
        
        const domains = new Set();
        for (const articleId of blockedArticleIds) {
            const article = await database.getArticle(articleId);
            if (article) {
                domains.add(article.domain);
            }
        }
        
        return Array.from(domains);
    }

    async unblockDomain(domain) {
        try {
            const feedback = await database.getRecommendationFeedback();
            const articles = await database.db.articles.where('domain').equals(domain).toArray();
            
            // Remove feedback for all articles from this domain
            for (const article of articles) {
                const feedbackItems = feedback.filter(f => 
                    f.articleId === article.id && f.type === 'block_domain'
                );
                for (const item of feedbackItems) {
                    await database.db.recommendationFeedback.delete(item.id);
                }
            }
            
            UI.showToast(`已解除屏蔽：${domain}`, 'success');
        } catch (error) {
            UI.showToast('操作失败: ' + error.message, 'error');
            throw error;
        }
    }

    async clearFeedback() {
        try {
            await database.db.recommendationFeedback.clear();
            UI.showToast('已清除所有反馈记录', 'success');
        } catch (error) {
            UI.showToast('清除失败: ' + error.message, 'error');
            throw error;
        }
    }
}

const recommendationEngine = new RecommendationEngine();
export default recommendationEngine;
export { recommendationEngine };

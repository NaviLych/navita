// Read later list management
import database from './db.js';
import UI from './ui.js';

class ReadLaterManager {
    async addToReadLater(articleId, tags = []) {
        try {
            const existing = await database.getReadLaterItemByArticleId(articleId);
            if (existing) {
                UI.showToast('已在稍后读列表中', 'info');
                return existing;
            }

            const item = await database.addReadLaterItem({
                articleId,
                tags,
                starred: false,
                status: 'unread',
                progress: 0
            });

            UI.showToast('已加入稍后读', 'success');
            return item;
        } catch (error) {
            UI.showToast('添加失败: ' + error.message, 'error');
            throw error;
        }
    }

    async removeFromReadLater(itemId) {
        try {
            await database.deleteReadLaterItem(itemId);
            UI.showToast('已从稍后读移除', 'success');
        } catch (error) {
            UI.showToast('移除失败: ' + error.message, 'error');
            throw error;
        }
    }

    async toggleStar(itemId) {
        try {
            const item = await database.getReadLaterItem(itemId);
            await database.updateReadLaterItem(itemId, {
                starred: !item.starred
            });
            return !item.starred;
        } catch (error) {
            UI.showToast('操作失败: ' + error.message, 'error');
            throw error;
        }
    }

    async updateProgress(itemId, progress) {
        try {
            await database.updateReadLaterItem(itemId, { progress });
            
            // Auto mark as done if progress >= 90%
            if (progress >= 90) {
                await this.markAsComplete(itemId);
            } else if (progress > 0) {
                await database.updateReadLaterItem(itemId, { status: 'reading' });
            }
        } catch (error) {
            console.error('Failed to update progress:', error);
        }
    }

    async markAsComplete(itemId) {
        try {
            const item = await database.getReadLaterItem(itemId);
            if (item.status !== 'done') {
                await database.updateReadLaterItem(itemId, {
                    status: 'done',
                    progress: 100
                });
                
                // Award points for completion
                await database.addPointsTransaction(20, 'task');
                UI.showToast('阅读完成！+20 积分', 'success');
                
                // Check daily task
                await this.checkDailyTasks();
            }
        } catch (error) {
            UI.showToast('操作失败: ' + error.message, 'error');
            throw error;
        }
    }

    async updateTags(itemId, tags) {
        try {
            await database.updateReadLaterItem(itemId, { tags });
            UI.showToast('标签已更新', 'success');
        } catch (error) {
            UI.showToast('更新失败: ' + error.message, 'error');
            throw error;
        }
    }

    async getReadLaterItems(filter = {}) {
        return await database.getReadLaterItems(filter);
    }

    async getReadLaterItem(itemId) {
        return await database.getReadLaterItem(itemId);
    }

    async checkDailyTasks() {
        const today = new Date().toISOString().split('T')[0];
        const todayStart = new Date(today + 'T00:00:00').toISOString();
        
        // Check if already got completion task reward today
        const todayTransactions = await database.db.pointsTransactions
            .where('createdAt')
            .between(todayStart, new Date().toISOString())
            .toArray();
        
        const hasCompletionReward = todayTransactions.some(t => t.reason === 'daily_complete_1');
        
        if (!hasCompletionReward) {
            // Check if completed 1 article today
            const todayItems = await database.db.readLaterItems
                .where('updatedAt')
                .between(todayStart, new Date().toISOString())
                .toArray();
            
            const completedToday = todayItems.filter(item => item.status === 'done').length;
            
            if (completedToday >= 1) {
                await database.addPointsTransaction(20, 'daily_complete_1');
                UI.showToast('完成每日任务：阅读1篇文章 +20积分', 'success');
            }
        }
    }

    async addNote(articleId, content, highlightRange = null) {
        try {
            const note = await database.addNote({
                articleId,
                content,
                highlightRange
            });
            UI.showToast('笔记已保存', 'success');
            return note;
        } catch (error) {
            UI.showToast('保存失败: ' + error.message, 'error');
            throw error;
        }
    }

    async getNotes(articleId) {
        return await database.getNotesByArticleId(articleId);
    }

    async deleteNote(noteId) {
        try {
            await database.deleteNote(noteId);
            UI.showToast('笔记已删除', 'success');
        } catch (error) {
            UI.showToast('删除失败: ' + error.message, 'error');
            throw error;
        }
    }

    async getAllTags() {
        return await database.getAllTags();
    }

    async batchUpdate(itemIds, updates) {
        try {
            UI.showLoading();
            for (const itemId of itemIds) {
                await database.updateReadLaterItem(itemId, updates);
            }
            UI.hideLoading();
            UI.showToast(`批量更新了 ${itemIds.length} 项`, 'success');
        } catch (error) {
            UI.hideLoading();
            UI.showToast('批量更新失败: ' + error.message, 'error');
            throw error;
        }
    }

    async batchDelete(itemIds) {
        try {
            UI.showLoading();
            for (const itemId of itemIds) {
                await database.deleteReadLaterItem(itemId);
            }
            UI.hideLoading();
            UI.showToast(`删除了 ${itemIds.length} 项`, 'success');
        } catch (error) {
            UI.hideLoading();
            UI.showToast('批量删除失败: ' + error.message, 'error');
            throw error;
        }
    }
}

const readLaterManager = new ReadLaterManager();
export default readLaterManager;
export { readLaterManager };

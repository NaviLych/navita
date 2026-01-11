// Check-in and points system
import database from './db.js';
import UI from './ui.js';

class CheckinManager {
    async checkin() {
        try {
            const result = await database.addCheckin();
            
            if (!result.success) {
                UI.showToast(result.message, 'info');
                return result;
            }
            
            // Show success animation
            const button = document.getElementById('checkin-btn');
            if (button) {
                const rect = button.getBoundingClientRect();
                UI.showPointsAnimation(10, rect.left + rect.width / 2, rect.top);
            }
            
            let message = `签到成功！+10 积分`;
            if (result.consecutiveDays > 0 && result.consecutiveDays % 7 === 0) {
                message += ` 🎉 连续签到${result.consecutiveDays}天，额外 +50 积分`;
            }
            
            UI.showToast(message, 'success', 4000);
            
            // Update checkin button state
            this.updateCheckinButton();
            
            return result;
        } catch (error) {
            UI.showToast('签到失败: ' + error.message, 'error');
            throw error;
        }
    }

    async getTodayCheckin() {
        const today = new Date().toISOString().split('T')[0];
        return await database.getCheckin(today);
    }

    async getCheckins(startDate, endDate) {
        return await database.getCheckins(startDate, endDate);
    }

    async getMonthCheckins(year, month) {
        const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month + 1, 0).getDate();
        const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        return await this.getCheckins(startDate, endDate);
    }

    async getConsecutiveDays() {
        return await database.getConsecutiveCheckinDays();
    }

    async getAllCheckins() {
        return await database.getAllCheckins();
    }

    async updateCheckinButton() {
        const button = document.getElementById('checkin-btn');
        if (!button) return;
        
        const todayCheckin = await this.getTodayCheckin();
        if (todayCheckin) {
            button.classList.add('checked');
            button.title = '今日已签到';
        } else {
            button.classList.remove('checked');
            button.title = '每日签到';
        }
    }

    async makeupCheckin(date) {
        try {
            // Check if within 7 days
            const today = new Date();
            const targetDate = new Date(date);
            const diffDays = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24));
            
            if (diffDays > 7 || diffDays < 1) {
                UI.showToast('只能补签最近7天内的日期', 'error');
                return;
            }
            
            // Check if already checked in
            const existing = await database.getCheckin(date);
            if (existing) {
                UI.showToast('该日期已签到', 'info');
                return;
            }
            
            // Check points
            const totalPoints = await database.getTotalPoints();
            if (totalPoints < 30) {
                UI.showToast('积分不足，需要 30 积分补签', 'error');
                return;
            }
            
            // Deduct points and add checkin
            await database.addPointsTransaction(-30, 'makeup_checkin');
            await database.addCheckin(date);
            
            UI.showToast('补签成功！-30 积分', 'success');
        } catch (error) {
            UI.showToast('补签失败: ' + error.message, 'error');
            throw error;
        }
    }

    async getDailyTasks() {
        const today = new Date().toISOString().split('T')[0];
        const todayStart = new Date(today + 'T00:00:00').toISOString();
        
        // Get today's transactions to check completed tasks
        const todayTransactions = await database.db.pointsTransactions
            .where('createdAt')
            .between(todayStart, new Date().toISOString())
            .toArray();
        
        // Get today's read later items
        const todayItems = await database.db.readLaterItems.toArray();
        const todayCompleted = todayItems.filter(item => 
            item.status === 'done' && 
            item.updatedAt >= todayStart
        ).length;
        
        const todayAdded = todayItems.filter(item => 
            item.addedAt >= todayStart
        ).length;
        
        const tasks = [
            {
                id: 'checkin',
                title: '每日签到',
                description: '完成今日签到',
                points: 10,
                completed: todayTransactions.some(t => t.reason === 'checkin'),
                progress: todayTransactions.some(t => t.reason === 'checkin') ? 1 : 0,
                target: 1
            },
            {
                id: 'complete_1',
                title: '完成阅读',
                description: '完成 1 篇文章阅读',
                points: 20,
                completed: todayTransactions.some(t => t.reason === 'daily_complete_1'),
                progress: todayCompleted,
                target: 1
            },
            {
                id: 'add_3',
                title: '收藏文章',
                description: '新增收藏 3 篇文章',
                points: 10,
                completed: todayTransactions.some(t => t.reason === 'daily_add_3'),
                progress: todayAdded,
                target: 3
            }
        ];
        
        return tasks;
    }

    async checkAndAwardTaskPoints() {
        const today = new Date().toISOString().split('T')[0];
        const todayStart = new Date(today + 'T00:00:00').toISOString();
        
        // Check if already got add task reward today
        const todayTransactions = await database.db.pointsTransactions
            .where('createdAt')
            .between(todayStart, new Date().toISOString())
            .toArray();
        
        const hasAddReward = todayTransactions.some(t => t.reason === 'daily_add_3');
        
        if (!hasAddReward) {
            const todayItems = await database.db.readLaterItems
                .where('addedAt')
                .between(todayStart, new Date().toISOString())
                .toArray();
            
            if (todayItems.length >= 3) {
                await database.addPointsTransaction(10, 'daily_add_3');
                UI.showToast('完成每日任务：收藏3篇文章 +10积分', 'success');
            }
        }
    }

    async getPointsHistory(limit = 20) {
        return await database.getPointsTransactions(limit);
    }

    async getTotalPoints() {
        return await database.getTotalPoints();
    }
}

const checkinManager = new CheckinManager();
export default checkinManager;
export { checkinManager };

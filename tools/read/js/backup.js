// Backup and import functionality
import database from './db.js';
import UI from './ui.js';

class BackupManager {
    async exportData() {
        try {
            UI.showLoading();
            
            const data = await database.exportData();
            
            // Convert to JSON and create download
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `read-later-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            UI.hideLoading();
            UI.showToast('数据导出成功', 'success');
        } catch (error) {
            UI.hideLoading();
            UI.showToast('导出失败: ' + error.message, 'error');
            throw error;
        }
    }

    async importData(file, mode = 'merge') {
        try {
            UI.showLoading();
            
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validate data structure
            if (!data.version || !data.exportDate) {
                throw new Error('无效的备份文件格式');
            }
            
            await database.importData(data, mode);
            
            UI.hideLoading();
            UI.showToast(`数据导入成功 (${mode === 'merge' ? '合并' : '覆盖'}模式)`, 'success');
        } catch (error) {
            UI.hideLoading();
            UI.showToast('导入失败: ' + error.message, 'error');
            throw error;
        }
    }

    showImportDialog() {
        const content = `
            <div class="import-options">
                <div class="form-group">
                    <label>选择备份文件</label>
                    <input type="file" id="import-file" accept=".json">
                </div>
                <div class="form-group">
                    <label>导入模式</label>
                    <div class="radio-group">
                        <label>
                            <input type="radio" name="import-mode" value="merge" checked>
                            合并（保留现有数据，添加新数据）
                        </label>
                        <label>
                            <input type="radio" name="import-mode" value="overwrite">
                            覆盖（清空现有数据，替换为备份数据）
                        </label>
                    </div>
                </div>
                <div class="warning-box">
                    ⚠️ 请确保备份文件来自可信来源。覆盖模式将删除所有现有数据！
                </div>
            </div>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="window.UI.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="window.backupManager.executeImport()">导入</button>
        `;

        UI.showModal(content, { title: '导入备份数据', footer });
    }

    async executeImport() {
        const fileInput = document.getElementById('import-file');
        const file = fileInput.files[0];
        
        if (!file) {
            UI.showToast('请选择备份文件', 'error');
            return;
        }
        
        const mode = document.querySelector('input[name="import-mode"]:checked').value;
        
        UI.closeModal();
        
        await this.importData(file, mode);
        
        // Reload current page to reflect imported data
        window.location.reload();
    }

    async clearAllData() {
        const confirmed = await this.showConfirmDialog(
            '确定要清除所有数据吗？此操作不可恢复！'
        );
        
        if (confirmed) {
            try {
                UI.showLoading();
                await database.clearAllData();
                UI.hideLoading();
                UI.showToast('所有数据已清除', 'success');
                
                // Reload page
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                UI.hideLoading();
                UI.showToast('清除失败: ' + error.message, 'error');
            }
        }
    }

    showConfirmDialog(message) {
        return new Promise((resolve) => {
            const content = `<p>${message}</p>`;
            const footer = `
                <button class="btn btn-secondary" onclick="window.backupManager.resolveConfirm(false)">取消</button>
                <button class="btn btn-danger" onclick="window.backupManager.resolveConfirm(true)">确认</button>
            `;
            
            this._confirmResolve = resolve;
            UI.showModal(content, { title: '确认操作', footer });
        });
    }

    resolveConfirm(value) {
        if (this._confirmResolve) {
            this._confirmResolve(value);
            this._confirmResolve = null;
        }
        UI.closeModal();
    }

    async getStorageInfo() {
        try {
            const stats = await database.getStats();
            const estimate = await navigator.storage?.estimate();
            
            return {
                usage: estimate?.usage || 0,
                quota: estimate?.quota || 0,
                usagePercent: estimate ? (estimate.usage / estimate.quota * 100).toFixed(2) : 0,
                articles: stats.totalArticles,
                notes: await database.db.notes.count(),
                checkins: await database.db.checkins.count()
            };
        } catch (error) {
            console.error('Failed to get storage info:', error);
            return null;
        }
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
}

const backupManager = new BackupManager();
window.backupManager = backupManager; // For modal callbacks

export default backupManager;
export { backupManager };

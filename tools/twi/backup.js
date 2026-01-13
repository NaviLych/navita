// Backup and restore functionality for Twi
// Supports: Local export/import, WebDAV, and iCloud

class BackupManager {
    constructor() {
        this.webdavConfig = this.loadWebDAVConfig();
        this.icloudConfig = this.loadiCloudConfig();
    }

    // ========== Local Export/Import ==========
    
    async exportToFile() {
        try {
            const data = await this.exportData();
            
            // Convert to JSON and create download
            const json = JSON.stringify(data, null, 2);
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `twi-backup-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            URL.revokeObjectURL(url);
            
            showToast('数据导出成功');
            return true;
        } catch (error) {
            console.error('Export failed:', error);
            showToast('导出失败: ' + error.message);
            return false;
        }
    }

    async importFromFile(file) {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Validate data structure
            if (!data.version || !data.exportDate || !Array.isArray(data.tweets)) {
                throw new Error('无效的备份文件格式');
            }
            
            await this.importData(data);
            
            showToast('数据导入成功，即将刷新页面');
            setTimeout(() => window.location.reload(), 1500);
            return true;
        } catch (error) {
            console.error('Import failed:', error);
            showToast('导入失败: ' + error.message);
            return false;
        }
    }

    async exportData() {
        // Get all tweets from IndexedDB
        const tweets = await loadTweets();
        
        return {
            version: '1.0',
            exportDate: new Date().toISOString(),
            tweets: tweets,
            stats: {
                totalTweets: tweets.length,
                totalLikes: tweets.reduce((sum, t) => sum + t.likes, 0)
            }
        };
    }

    async importData(data) {
        // Clear existing tweets
        tweets.length = 0;
        
        // Import new tweets
        tweets.push(...data.tweets);
        
        // Save to IndexedDB
        await saveTweets();
    }

    // ========== WebDAV Backup ==========
    
    loadWebDAVConfig() {
        try {
            const config = localStorage.getItem('twi-webdav-config');
            return config ? JSON.parse(config) : { url: '', username: '', password: '' };
        } catch {
            return { url: '', username: '', password: '' };
        }
    }

    saveWebDAVConfig(config) {
        localStorage.setItem('twi-webdav-config', JSON.stringify(config));
        this.webdavConfig = config;
    }

    async backupToWebDAV() {
        if (!this.webdavConfig.url) {
            showToast('请先配置WebDAV服务器');
            return false;
        }

        try {
            const data = await this.exportData();
            const json = JSON.stringify(data, null, 2);
            
            const filename = `twi-backup-${new Date().toISOString().split('T')[0]}.json`;
            const url = this.webdavConfig.url.replace(/\/$/, '') + '/' + filename;
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Authorization': 'Basic ' + btoa(this.webdavConfig.username + ':' + this.webdavConfig.password),
                    'Content-Type': 'application/json'
                },
                body: json
            });

            if (!response.ok) {
                throw new Error(`WebDAV备份失败: ${response.status} ${response.statusText}`);
            }

            showToast('WebDAV备份成功');
            return true;
        } catch (error) {
            console.error('WebDAV backup failed:', error);
            showToast('WebDAV备份失败: ' + error.message);
            return false;
        }
    }

    async restoreFromWebDAV(filename) {
        if (!this.webdavConfig.url) {
            showToast('请先配置WebDAV服务器');
            return false;
        }

        try {
            const url = this.webdavConfig.url.replace(/\/$/, '') + '/' + filename;
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': 'Basic ' + btoa(this.webdavConfig.username + ':' + this.webdavConfig.password)
                }
            });

            if (!response.ok) {
                throw new Error(`WebDAV恢复失败: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            await this.importData(data);
            
            showToast('WebDAV恢复成功，即将刷新页面');
            setTimeout(() => window.location.reload(), 1500);
            return true;
        } catch (error) {
            console.error('WebDAV restore failed:', error);
            showToast('WebDAV恢复失败: ' + error.message);
            return false;
        }
    }

    async listWebDAVBackups() {
        if (!this.webdavConfig.url) {
            return [];
        }

        try {
            const response = await fetch(this.webdavConfig.url, {
                method: 'PROPFIND',
                headers: {
                    'Authorization': 'Basic ' + btoa(this.webdavConfig.username + ':' + this.webdavConfig.password),
                    'Depth': '1'
                }
            });

            if (!response.ok) {
                throw new Error(`列出备份失败: ${response.status}`);
            }

            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'text/xml');
            
            const files = [];
            const responses = xmlDoc.getElementsByTagName('d:response');
            
            for (let i = 0; i < responses.length; i++) {
                const href = responses[i].getElementsByTagName('d:href')[0]?.textContent;
                if (href && href.includes('twi-backup-') && href.endsWith('.json')) {
                    const filename = href.split('/').pop();
                    const lastModified = responses[i].getElementsByTagName('d:getlastmodified')[0]?.textContent;
                    files.push({ filename, lastModified });
                }
            }
            
            return files;
        } catch (error) {
            console.error('Failed to list WebDAV backups:', error);
            return [];
        }
    }

    // ========== iCloud Backup ==========
    
    loadiCloudConfig() {
        try {
            const config = localStorage.getItem('twi-icloud-config');
            return config ? JSON.parse(config) : { enabled: false, containerId: '' };
        } catch {
            return { enabled: false, containerId: '' };
        }
    }

    saveiCloudConfig(config) {
        localStorage.setItem('twi-icloud-config', JSON.stringify(config));
        this.icloudConfig = config;
    }

    async backupToiCloud() {
        // Note: iCloud backup through CloudKit JS requires proper setup
        // This is a simplified implementation that uses iCloud Drive web access if available
        
        if (!this.icloudConfig.enabled) {
            showToast('请先启用iCloud备份');
            return false;
        }

        try {
            // Check if CloudKit is available
            if (typeof CloudKit === 'undefined') {
                // Fallback: use local download and inform user to manually upload to iCloud
                await this.exportToFile();
                showToast('请将下载的备份文件手动上传到iCloud Drive');
                return true;
            }

            // If CloudKit is available, use it
            const data = await this.exportData();
            const json = JSON.stringify(data, null, 2);
            
            // This would require CloudKit configuration
            // For now, we'll use the manual method
            const blob = new Blob([json], { type: 'application/json' });
            const filename = `twi-backup-${new Date().toISOString().split('T')[0]}.json`;
            
            // Save to Files API if available (iOS/iPadOS)
            if (window.showSaveFilePicker) {
                const handle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'JSON Files',
                        accept: { 'application/json': ['.json'] }
                    }]
                });
                const writable = await handle.createWritable();
                await writable.write(blob);
                await writable.close();
                
                showToast('备份已保存到文件系统，请同步到iCloud Drive');
            } else {
                // Fallback to regular download
                await this.exportToFile();
                showToast('请将下载的备份文件手动上传到iCloud Drive');
            }
            
            return true;
        } catch (error) {
            console.error('iCloud backup failed:', error);
            showToast('iCloud备份失败: ' + error.message);
            return false;
        }
    }

    async restoreFromiCloud() {
        if (!this.icloudConfig.enabled) {
            showToast('请先启用iCloud备份');
            return false;
        }

        try {
            // Open file picker to select backup file
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            
            return new Promise((resolve) => {
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const success = await this.importFromFile(file);
                        resolve(success);
                    } else {
                        resolve(false);
                    }
                };
                
                input.oncancel = () => resolve(false);
                input.click();
            });
        } catch (error) {
            console.error('iCloud restore failed:', error);
            showToast('iCloud恢复失败: ' + error.message);
            return false;
        }
    }

    // ========== UI Helpers ==========
    
    showBackupDialog() {
        const modal = document.createElement('div');
        modal.className = 'backup-modal';
        modal.innerHTML = `
            <div class="backup-modal-content">
                <div class="backup-modal-header">
                    <h2>备份与恢复</h2>
                    <button class="backup-modal-close" onclick="this.closest('.backup-modal').remove()">✕</button>
                </div>
                <div class="backup-modal-body">
                    <div class="backup-section">
                        <h3>💾 本地备份</h3>
                        <div class="backup-buttons">
                            <button class="backup-btn" onclick="backupManager.exportToFile()">📤 导出到文件</button>
                            <button class="backup-btn" onclick="backupManager.showImportDialog()">📥 从文件导入</button>
                        </div>
                    </div>
                    
                    <div class="backup-section">
                        <h3>☁️ WebDAV备份</h3>
                        <div class="backup-config">
                            <input type="text" id="webdav-url" placeholder="WebDAV服务器URL" value="${this.webdavConfig.url || ''}">
                            <input type="text" id="webdav-username" placeholder="用户名" value="${this.webdavConfig.username || ''}">
                            <input type="password" id="webdav-password" placeholder="密码" value="${this.webdavConfig.password || ''}">
                            <button class="backup-btn" onclick="backupManager.saveWebDAVConfigFromDialog()">保存配置</button>
                        </div>
                        <div class="backup-buttons">
                            <button class="backup-btn" onclick="backupManager.backupToWebDAV()">☁️ 备份到WebDAV</button>
                            <button class="backup-btn" onclick="backupManager.showWebDAVRestoreDialog()">☁️ 从WebDAV恢复</button>
                        </div>
                    </div>
                    
                    <div class="backup-section">
                        <h3>☁️ iCloud备份</h3>
                        <div class="backup-config">
                            <label>
                                <input type="checkbox" id="icloud-enabled" ${this.icloudConfig.enabled ? 'checked' : ''}>
                                启用iCloud备份
                            </label>
                            <button class="backup-btn" onclick="backupManager.saveiCloudConfigFromDialog()">保存配置</button>
                        </div>
                        <div class="backup-buttons">
                            <button class="backup-btn" onclick="backupManager.backupToiCloud()">☁️ 备份到iCloud</button>
                            <button class="backup-btn" onclick="backupManager.restoreFromiCloud()">☁️ 从iCloud恢复</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                await this.importFromFile(file);
            }
        };
        input.click();
    }

    async showWebDAVRestoreDialog() {
        const files = await this.listWebDAVBackups();
        
        if (files.length === 0) {
            showToast('没有找到WebDAV备份文件');
            return;
        }

        const fileList = files.map(f => 
            `<div class="backup-file-item" onclick="backupManager.restoreFromWebDAV('${f.filename}')">
                <span>📄 ${f.filename}</span>
                <span class="backup-file-date">${f.lastModified || ''}</span>
            </div>`
        ).join('');

        const modal = document.createElement('div');
        modal.className = 'backup-modal';
        modal.innerHTML = `
            <div class="backup-modal-content">
                <div class="backup-modal-header">
                    <h2>选择备份文件</h2>
                    <button class="backup-modal-close" onclick="this.closest('.backup-modal').remove()">✕</button>
                </div>
                <div class="backup-modal-body">
                    <div class="backup-file-list">
                        ${fileList}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    saveWebDAVConfigFromDialog() {
        const config = {
            url: document.getElementById('webdav-url').value.trim(),
            username: document.getElementById('webdav-username').value.trim(),
            password: document.getElementById('webdav-password').value
        };
        
        this.saveWebDAVConfig(config);
        showToast('WebDAV配置已保存');
    }

    saveiCloudConfigFromDialog() {
        const config = {
            enabled: document.getElementById('icloud-enabled').checked,
            containerId: ''
        };
        
        this.saveiCloudConfig(config);
        showToast('iCloud配置已保存');
    }
}

// Create global instance
const backupManager = new BackupManager();
window.backupManager = backupManager;

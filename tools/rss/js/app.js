// Main application entry point
// Initializes all modules and starts the app

import db from './db.js';
import feedsManager from './feeds.js';
import articlesManager from './articles.js';
import ui from './ui.js';
import { showToast, showLoading, hideLoading } from './ui.js';

class App {
    constructor() {
        this.initialized = false;
    }

    // Initialize application
    async init() {
        try {
            showLoading();

            // Initialize database
            await db.init();
            console.log('Database initialized');

            // Initialize managers
            await feedsManager.init();
            await articlesManager.init();
            console.log('Managers initialized');

            // Initialize UI
            ui.init();
            console.log('UI initialized');

            // Render initial UI
            await this.renderApp();

            // Setup settings handlers
            this.setupSettings();

            // Mark as initialized
            this.initialized = true;

            hideLoading();
            console.log('App initialized successfully');

            // Auto-refresh feeds on startup (optional)
            const autoRefresh = await db.getSetting('autoRefresh');
            if (autoRefresh && autoRefresh.value) {
                setTimeout(() => this.refreshFeeds(), 2000);
            }
        } catch (error) {
            console.error('Error initializing app:', error);
            hideLoading();
            showToast('应用初始化失败', 'error');
        }
    }

    // Render application UI
    async renderApp() {
        await ui.renderFeeds();
        await ui.renderArticles();
    }

    // Refresh all feeds
    async refreshFeeds() {
        try {
            await feedsManager.updateAllFeeds();
            await this.renderApp();
        } catch (error) {
            console.error('Error refreshing feeds:', error);
        }
    }

    // Setup settings handlers
    setupSettings() {
        // Auto mark as read setting
        const autoMarkRead = document.getElementById('auto-mark-read');
        if (autoMarkRead) {
            db.getSetting('autoMarkRead').then(setting => {
                if (setting) autoMarkRead.checked = setting.value;
            });

            autoMarkRead.addEventListener('change', async () => {
                await db.setSetting('autoMarkRead', autoMarkRead.checked);
                showToast('设置已保存', 'success');
            });
        }

        // Show images setting
        const showImages = document.getElementById('show-images');
        if (showImages) {
            db.getSetting('showImages').then(setting => {
                if (setting) {
                    showImages.checked = setting.value;
                } else {
                    showImages.checked = true; // Default to true
                }
            });

            showImages.addEventListener('change', async () => {
                await db.setSetting('showImages', showImages.checked);
                showToast('设置已保存', 'success');
            });
        }

        // Export data
        const exportBtn = document.getElementById('export-data');
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                try {
                    const data = await db.exportData();
                    const json = JSON.stringify(data, null, 2);
                    const blob = new Blob([json], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `rss-backup-${Date.now()}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast('数据导出成功', 'success');
                } catch (error) {
                    console.error('Error exporting data:', error);
                    showToast('导出失败', 'error');
                }
            });
        }

        // Import data
        const importBtn = document.getElementById('import-data');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'application/json';
                input.onchange = async (e) => {
                    try {
                        const file = e.target.files[0];
                        if (!file) return;

                        const text = await file.text();
                        const data = JSON.parse(text);
                        
                        if (confirm('导入数据将覆盖现有数据，确定继续吗？')) {
                            showLoading();
                            await db.importData(data);
                            await feedsManager.init();
                            await articlesManager.init();
                            await this.renderApp();
                            hideLoading();
                            showToast('数据导入成功', 'success');
                            window.closeSettingsModal();
                        }
                    } catch (error) {
                        console.error('Error importing data:', error);
                        hideLoading();
                        showToast('导入失败', 'error');
                    }
                };
                input.click();
            });
        }

        // Clear data
        const clearBtn = document.getElementById('clear-data');
        if (clearBtn) {
            clearBtn.addEventListener('click', async () => {
                if (confirm('确定要清除所有数据吗？此操作不可恢复！')) {
                    if (confirm('再次确认：真的要清除所有数据吗？')) {
                        try {
                            showLoading();
                            await db.clearAllData();
                            await feedsManager.init();
                            await articlesManager.init();
                            await this.renderApp();
                            hideLoading();
                            showToast('数据已清除', 'success');
                            window.closeSettingsModal();
                        } catch (error) {
                            console.error('Error clearing data:', error);
                            hideLoading();
                            showToast('清除失败', 'error');
                        }
                    }
                }
            });
        }
    }

    // Get app instance
    static getInstance() {
        if (!App.instance) {
            App.instance = new App();
        }
        return App.instance;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = App.getInstance();
        app.init();
    });
} else {
    const app = App.getInstance();
    app.init();
}

// Export for external use
export default App;

// Main application file
import database from './db.js';
import router from './router.js';
import UI from './ui.js';
import articleManager from './article.js';
import readLaterManager from './readlater.js';
import checkinManager from './checkin.js';
import recommendationEngine from './recommendation.js';
import backupManager from './backup.js';
import statsManager from './stats.js';

class App {
    constructor() {
        this.init();
    }

    async init() {
        // Register routes
        router.register('/home', (params) => this.renderHome(params));
        router.register('/read-later', (params) => this.renderReadLater(params));
        router.register('/article/:id', (params) => this.renderArticle(params));
        router.register('/checkin', (params) => this.renderCheckin(params));
        router.register('/search', (params) => this.renderSearch(params));
        router.register('/stats', (params) => this.renderStats(params));
        router.register('/settings', (params) => this.renderSettings(params));

        // Set up event listeners
        this.setupEventListeners();

        // Update checkin button state
        await checkinManager.updateCheckinButton();

        // Initialize settings
        await database.getSettings();
    }

    setupEventListeners() {
        // Checkin button
        document.getElementById('checkin-btn').addEventListener('click', async () => {
            await checkinManager.checkin();
        });

        // FAB button
        const fab = document.getElementById('fab');
        fab.addEventListener('click', () => {
            const currentRoute = router.getCurrentRoute();
            if (currentRoute === '/home' || currentRoute === '/read-later') {
                this.showAddArticleModal();
            }
        });

        // Global card action handlers
        document.addEventListener('click', async (e) => {
            const button = e.target.closest('[data-action]');
            if (!button) return;

            const action = button.dataset.action;
            const card = button.closest('.article-card');
            if (!card) return;

            const articleId = parseInt(card.dataset.articleId);
            const readLaterId = card.dataset.readLaterId ? parseInt(card.dataset.readLaterId) : null;

            switch (action) {
                case 'open':
                    router.navigate(`/article/${articleId}`);
                    break;
                case 'add-later':
                    await readLaterManager.addToReadLater(articleId);
                    button.textContent = '✅';
                    setTimeout(() => {
                        button.textContent = '📌';
                    }, 2000);
                    break;
                case 'star':
                    if (readLaterId) {
                        const starred = await readLaterManager.toggleStar(readLaterId);
                        button.classList.toggle('active', starred);
                    }
                    break;
                case 'delete':
                    if (readLaterId) {
                        if (confirm('确定要删除这篇文章吗？')) {
                            await readLaterManager.removeFromReadLater(readLaterId);
                            card.remove();
                        }
                    }
                    break;
                case 'not-interested':
                    await recommendationEngine.addFeedback(articleId, 'not_interested');
                    card.style.display = 'none';
                    break;
                case 'block-domain':
                    if (confirm('确定要屏蔽该来源的所有文章吗？')) {
                        await recommendationEngine.addFeedback(articleId, 'block_domain');
                        // Reload recommendations
                        if (router.getCurrentRoute() === '/home') {
                            this.renderHome();
                        }
                    }
                    break;
            }
        });
    }

    updateFAB(show = true) {
        const fab = document.getElementById('fab');
        if (show) {
            fab.classList.remove('hidden');
        } else {
            fab.classList.add('hidden');
        }
    }

    async renderHome(params) {
        const main = document.getElementById('main-content');
        
        main.innerHTML = `
            <div class="home-page">
                <div class="page-header">
                    <h2>首页</h2>
                </div>
                
                <div class="category-tabs">
                    <button class="tab-btn active" data-tab="all">全部</button>
                    <button class="tab-btn" data-tab="unread">未读</button>
                    <button class="tab-btn" data-tab="reading">在读</button>
                    <button class="tab-btn" data-tab="done">已完成</button>
                    <button class="tab-btn" data-tab="starred">星标</button>
                </div>
                
                <div id="articles-container" class="waterfall-container"></div>
                
                <div class="section-header">
                    <h3>🎯 猜你喜欢</h3>
                    <button class="btn-link" id="refresh-recommendations">刷新</button>
                </div>
                <div id="recommendations-container" class="waterfall-container"></div>
            </div>
        `;

        // Show FAB
        this.updateFAB(true);

        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const tab = btn.dataset.tab;
                this.loadArticles(tab);
            });
        });

        // Refresh recommendations
        document.getElementById('refresh-recommendations').addEventListener('click', () => {
            this.loadRecommendations();
        });

        // Load initial data
        await this.loadArticles('all');
        await this.loadRecommendations();
    }

    async loadArticles(filter) {
        UI.showLoading();
        
        let filterObj = {};
        if (filter === 'unread') filterObj.status = 'unread';
        else if (filter === 'reading') filterObj.status = 'reading';
        else if (filter === 'done') filterObj.status = 'done';
        else if (filter === 'starred') filterObj.starred = true;
        
        const items = await readLaterManager.getReadLaterItems(filterObj);
        
        const cards = [];
        for (const item of items) {
            const article = await database.getArticle(item.articleId);
            if (article) {
                const card = UI.createArticleCard(article, item);
                cards.push(card);
            }
        }
        
        const container = document.getElementById('articles-container');
        if (cards.length === 0) {
            container.innerHTML = '<div class="empty-state">📚 暂无文章，快去添加吧！</div>';
        } else {
            UI.createWaterfallLayout(cards, 'articles-container');
        }
        
        UI.hideLoading();
    }

    async loadRecommendations() {
        UI.showLoading();
        
        const recommendations = await recommendationEngine.getRecommendations(20);
        
        const cards = recommendations.map(article => {
            const card = UI.createArticleCard(article);
            
            // Add recommendation-specific actions
            const actions = card.querySelector('.card-actions');
            actions.innerHTML = `
                <button class="btn-icon" data-action="not-interested" title="不感兴趣">👎</button>
                <button class="btn-icon" data-action="block-domain" title="屏蔽来源">🚫</button>
                <button class="btn-icon" data-action="add-later" title="加入稍后读">📌</button>
                <button class="btn-icon" data-action="open" title="阅读">📖</button>
            `;
            
            return card;
        });
        
        const container = document.getElementById('recommendations-container');
        if (cards.length === 0) {
            container.innerHTML = '<div class="empty-state">🎯 暂无推荐，先添加一些文章吧！</div>';
        } else {
            UI.createWaterfallLayout(cards, 'recommendations-container');
        }
        
        UI.hideLoading();
    }

    showAddArticleModal() {
        const content = `
            <form id="add-article-form">
                <div class="form-group">
                    <label>文章链接 *</label>
                    <input type="url" name="url" required placeholder="https://example.com/article">
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" name="add-to-readlater" checked>
                        同时加入稍后读
                    </label>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="window.UI.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="window.app.submitAddArticle()">添加</button>
        `;

        UI.showModal(content, { title: '添加文章', footer });
    }

    async submitAddArticle() {
        const form = document.getElementById('add-article-form');
        const formData = new FormData(form);
        const url = formData.get('url');
        const addToReadLater = formData.get('add-to-readlater');
        
        if (!url) {
            UI.showToast('请输入文章链接', 'error');
            return;
        }
        
        UI.closeModal();
        
        const article = await articleManager.addArticle(url);
        
        if (article && addToReadLater) {
            await readLaterManager.addToReadLater(article.id);
            await checkinManager.checkAndAwardTaskPoints();
        }
        
        // Reload current view
        if (router.getCurrentRoute() === '/home') {
            this.loadArticles('all');
        }
    }

    async renderReadLater(params) {
        const main = document.getElementById('main-content');
        
        main.innerHTML = `
            <div class="read-later-page">
                <div class="page-header">
                    <h2>稍后读</h2>
                </div>
                
                <div class="filters-bar">
                    <select id="status-filter" class="filter-select">
                        <option value="">所有状态</option>
                        <option value="unread">未读</option>
                        <option value="reading">在读</option>
                        <option value="done">已完成</option>
                    </select>
                    
                    <select id="tag-filter" class="filter-select">
                        <option value="">所有标签</option>
                    </select>
                    
                    <label class="filter-checkbox">
                        <input type="checkbox" id="starred-filter">
                        仅显示星标
                    </label>
                </div>
                
                <div id="read-later-list"></div>
            </div>
        `;

        // Show FAB
        this.updateFAB(true);

        // Load tags
        const tags = await readLaterManager.getAllTags();
        const tagFilter = document.getElementById('tag-filter');
        tags.forEach(tag => {
            const option = document.createElement('option');
            option.value = tag;
            option.textContent = tag;
            tagFilter.appendChild(option);
        });

        // Filter handlers
        const loadFiltered = () => this.loadReadLaterList();
        document.getElementById('status-filter').addEventListener('change', loadFiltered);
        document.getElementById('tag-filter').addEventListener('change', loadFiltered);
        document.getElementById('starred-filter').addEventListener('change', loadFiltered);

        // Load initial list
        await this.loadReadLaterList();
    }

    async loadReadLaterList() {
        const statusFilter = document.getElementById('status-filter').value;
        const tagFilter = document.getElementById('tag-filter').value;
        const starredOnly = document.getElementById('starred-filter').checked;
        
        const filter = {};
        if (statusFilter) filter.status = statusFilter;
        if (tagFilter) filter.tags = [tagFilter];
        if (starredOnly) filter.starred = true;
        
        const items = await readLaterManager.getReadLaterItems(filter);
        
        const listContainer = document.getElementById('read-later-list');
        
        if (items.length === 0) {
            listContainer.innerHTML = '<div class="empty-state">📚 列表为空</div>';
            return;
        }
        
        listContainer.innerHTML = '';
        
        for (const item of items) {
            const article = await database.getArticle(item.articleId);
            if (article) {
                const card = UI.createArticleCard(article, item);
                listContainer.appendChild(card);
            }
        }
    }

    async renderArticle(params) {
        // Hide FAB
        this.updateFAB(false);
        
        // Extract article ID from hash
        const hash = window.location.hash;
        const match = hash.match(/\/article\/(\d+)/);
        if (!match) {
            router.navigate('/home');
            return;
        }
        
        const articleId = parseInt(match[1]);
        const article = await database.getArticle(articleId);
        
        if (!article) {
            UI.showToast('文章不存在', 'error');
            router.navigate('/home');
            return;
        }
        
        const readLaterItem = await database.getReadLaterItemByArticleId(articleId);
        const notes = await readLaterManager.getNotes(articleId);
        
        const main = document.getElementById('main-content');
        
        main.innerHTML = `
            <div class="article-page">
                <div class="article-header">
                    <button class="btn-back" onclick="history.back()">← 返回</button>
                    <div class="article-actions">
                        ${!readLaterItem ? `
                            <button class="btn" id="add-to-readlater-btn">加入稍后读</button>
                        ` : `
                            <button class="btn-icon ${readLaterItem.starred ? 'active' : ''}" id="toggle-star-btn">
                                ${readLaterItem.starred ? '⭐' : '☆'}
                            </button>
                            ${readLaterItem.status !== 'done' ? `
                                <button class="btn btn-primary" id="mark-complete-btn">✓</button>
                            ` : `
                                <span class="badge">✓</span>
                            `}
                        `}
                    </div>
                </div>
                
                ${readLaterItem && readLaterItem.status !== 'done' ? `
                    <div class="progress-bar-container">
                        <div class="progress-bar">
                            <div class="progress-fill" id="reading-progress" style="width: ${readLaterItem.progress}%"></div>
                        </div>
                        <span class="progress-text">${readLaterItem.progress}%</span>
                    </div>
                ` : ''}
                
                <article class="article-content" id="article-content">
                    <h1>${article.title}</h1>
                    <div class="article-meta">
                        <span>${UI.extractDomain(article.url)}</span>
                        <span>${article.estReadTime || 5} 分钟阅读</span>
                        <span>${UI.formatDate(article.createdAt)}</span>
                    </div>
                    
                    ${article.cover ? `<img src="${article.cover}" alt="${article.title}" class="article-cover">` : ''}
                    
                    <div class="article-body">
                        ${article.content || article.excerpt || '<p>暂无内容，请访问原文链接查看。</p>'}
                    </div>
                    
                    <div class="article-footer">
                        <a href="${article.url}" target="_blank" class="btn">查看原文 →</a>
                    </div>
                </article>
                
                <div class="notes-section">
                    <h3>📝 笔记 (${notes.length})</h3>
                    <button class="btn btn-sm" id="add-note-btn">➕ 添加笔记</button>
                    <div id="notes-list">
                        ${notes.map(note => `
                            <div class="note-item" data-note-id="${note.id}">
                                <div class="note-content">${UI.sanitizeHTML(note.content)}</div>
                                <div class="note-meta">
                                    <span>${UI.formatDate(note.createdAt)}</span>
                                    <button class="btn-link" onclick="app.deleteNote(${note.id})">删除</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        // Set up event handlers
        if (readLaterItem) {
            document.getElementById('toggle-star-btn')?.addEventListener('click', async () => {
                await readLaterManager.toggleStar(readLaterItem.id);
                this.renderArticle(params);
            });

            document.getElementById('mark-complete-btn')?.addEventListener('click', async () => {
                await readLaterManager.markAsComplete(readLaterItem.id);
                this.renderArticle(params);
            });

            // Track reading progress
            this.trackReadingProgress(articleId, readLaterItem.id);
        } else {
            document.getElementById('add-to-readlater-btn')?.addEventListener('click', async () => {
                await readLaterManager.addToReadLater(articleId);
                this.renderArticle(params);
            });
        }

        // Add note button
        document.getElementById('add-note-btn')?.addEventListener('click', () => {
            this.showAddNoteModal(articleId);
        });
    }

    trackReadingProgress(articleId, readLaterId) {
        const content = document.getElementById('article-content');
        if (!content) return;

        const updateProgress = UI.throttle(() => {
            const scrollTop = content.scrollTop || window.scrollY;
            const scrollHeight = content.scrollHeight || document.documentElement.scrollHeight;
            const clientHeight = content.clientHeight || window.innerHeight;
            
            const progress = Math.min(100, Math.round((scrollTop + clientHeight) / scrollHeight * 100));
            
            const progressFill = document.getElementById('reading-progress');
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
                progressFill.parentElement.nextElementSibling.textContent = `${progress}%`;
            }
            
            readLaterManager.updateProgress(readLaterId, progress);
        }, 1000);

        window.addEventListener('scroll', updateProgress);
        content.addEventListener('scroll', updateProgress);
    }

    showAddNoteModal(articleId) {
        const content = `
            <form id="add-note-form">
                <div class="form-group">
                    <label>笔记内容</label>
                    <textarea name="content" rows="6" required placeholder="输入你的笔记..."></textarea>
                </div>
            </form>
        `;

        const footer = `
            <button class="btn btn-secondary" onclick="window.UI.closeModal()">取消</button>
            <button class="btn btn-primary" onclick="window.app.submitNote(${articleId})">保存</button>
        `;

        UI.showModal(content, { title: '添加笔记', footer });
    }

    async submitNote(articleId) {
        const form = document.getElementById('add-note-form');
        const formData = new FormData(form);
        const content = formData.get('content');
        
        if (!content) {
            UI.showToast('请输入笔记内容', 'error');
            return;
        }
        
        await readLaterManager.addNote(articleId, content);
        UI.closeModal();
        
        // Reload article page
        this.renderArticle({});
    }

    async deleteNote(noteId) {
        if (confirm('确定要删除这条笔记吗？')) {
            await readLaterManager.deleteNote(noteId);
            this.renderArticle({});
        }
    }

    async renderCheckin(params) {
        // Hide FAB
        this.updateFAB(false);
        
        const main = document.getElementById('main-content');
        
        const todayCheckin = await checkinManager.getTodayCheckin();
        const consecutiveDays = await checkinManager.getConsecutiveDays();
        const totalPoints = await checkinManager.getTotalPoints();
        const tasks = await checkinManager.getDailyTasks();
        
        // Get current month checkins
        const now = new Date();
        const checkins = await checkinManager.getMonthCheckins(now.getFullYear(), now.getMonth());
        
        main.innerHTML = `
            <div class="checkin-page">
                <div class="checkin-header">
                    <h2>每日打卡</h2>
                    <div class="points-display">
                        <span class="points-icon">💰</span>
                        <span class="points-value">${totalPoints}</span>
                        <span class="points-label">积分</span>
                    </div>
                </div>
                
                <div class="checkin-card">
                    ${!todayCheckin ? `
                        <button class="btn-checkin-large" id="checkin-large-btn">
                            <span class="icon">📅</span>
                            <span class="text">立即签到</span>
                        </button>
                    ` : `
                        <div class="checked-status">
                            <span class="icon">✅</span>
                            <span class="text">今日已签到</span>
                        </div>
                    `}
                    <div class="streak-info">
                        <span class="streak-icon">🔥</span>
                        <span class="streak-text">连续 ${consecutiveDays} 天</span>
                    </div>
                </div>
                
                <div class="tasks-section">
                    <h3>📋 今日任务</h3>
                    <div class="tasks-list">
                        ${tasks.map(task => `
                            <div class="task-item ${task.completed ? 'completed' : ''}">
                                <div class="task-info">
                                    <div class="task-title">${task.title}</div>
                                    <div class="task-desc">${task.description}</div>
                                </div>
                                <div class="task-reward">
                                    ${task.completed ? '✅' : `+${task.points}`}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="calendar-section">
                    <h3>📆 签到日历</h3>
                    <div id="calendar-container"></div>
                </div>
            </div>
        `;

        // Render calendar
        const calendarHtml = UI.renderCalendar(now.getFullYear(), now.getMonth(), checkins);
        document.getElementById('calendar-container').innerHTML = calendarHtml;

        // Checkin button
        document.getElementById('checkin-large-btn')?.addEventListener('click', async () => {
            await checkinManager.checkin();
            this.renderCheckin(params);
        });

        // Calendar navigation
        let currentYear = now.getFullYear();
        let currentMonth = now.getMonth();
        
        document.addEventListener('click', async (e) => {
            if (e.target.dataset.action === 'prev-month') {
                currentMonth--;
                if (currentMonth < 0) {
                    currentMonth = 11;
                    currentYear--;
                }
                const checkins = await checkinManager.getMonthCheckins(currentYear, currentMonth);
                const calendarHtml = UI.renderCalendar(currentYear, currentMonth, checkins);
                document.getElementById('calendar-container').innerHTML = calendarHtml;
            } else if (e.target.dataset.action === 'next-month') {
                currentMonth++;
                if (currentMonth > 11) {
                    currentMonth = 0;
                    currentYear++;
                }
                const checkins = await checkinManager.getMonthCheckins(currentYear, currentMonth);
                const calendarHtml = UI.renderCalendar(currentYear, currentMonth, checkins);
                document.getElementById('calendar-container').innerHTML = calendarHtml;
            }
        });
    }

    async renderSearch(params) {
        const query = params.query || '';
        
        const main = document.getElementById('main-content');
        
        main.innerHTML = `
            <div class="search-page">
                <div class="page-header">
                    <h2>搜索结果</h2>
                    <p class="search-query">关键词: "${query}"</p>
                </div>
                <div id="search-results"></div>
            </div>
        `;

        if (query) {
            UI.showLoading();
            const articles = await articleManager.searchArticles(query);
            
            const resultsContainer = document.getElementById('search-results');
            
            if (articles.length === 0) {
                resultsContainer.innerHTML = '<div class="empty-state">🔍 未找到相关文章</div>';
            } else {
                const cards = [];
                for (const article of articles) {
                    const readLaterItem = await database.getReadLaterItemByArticleId(article.id);
                    const card = UI.createArticleCard(article, readLaterItem);
                    cards.push(card);
                }
                UI.createWaterfallLayout(cards, 'search-results');
            }
            
            UI.hideLoading();
        }
    }

    async renderStats(params) {
        // Hide FAB
        this.updateFAB(false);
        
        const main = document.getElementById('main-content');
        
        UI.showLoading();
        const stats = await statsManager.getDetailedStats();
        const achievements = await statsManager.getAchievements();
        UI.hideLoading();
        
        main.innerHTML = `
            <div class="stats-page">
                <div class="page-header">
                    <h2>📊 统计</h2>
                </div>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalArticles}</div>
                        <div class="stat-label">总文章数</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.completedArticles}</div>
                        <div class="stat-label">已完成</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.completionRate}%</div>
                        <div class="stat-label">完成率</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.consecutiveDays}</div>
                        <div class="stat-label">连续签到</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalPoints}</div>
                        <div class="stat-label">总积分</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${stats.readingMinutes}</div>
                        <div class="stat-label">阅读分钟</div>
                    </div>
                </div>
                
                ${achievements.length > 0 ? `
                    <div class="achievements-section">
                        <h3>🏆 成就</h3>
                        <div class="achievements-grid">
                            ${achievements.map(a => `
                                <div class="achievement-card">
                                    <div class="achievement-icon">${a.icon}</div>
                                    <div class="achievement-title">${a.title}</div>
                                    <div class="achievement-desc">${a.description}</div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${stats.tagStats && stats.tagStats.length > 0 ? `
                    <div class="stats-section">
                        <h3>🏷️ 标签统计</h3>
                        <div class="stats-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>标签</th>
                                        <th>总数</th>
                                        <th>已完成</th>
                                        <th>完成率</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${stats.tagStats.map(s => `
                                        <tr>
                                            <td>${s.tag}</td>
                                            <td>${s.total}</td>
                                            <td>${s.completed}</td>
                                            <td>${s.completionRate}%</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}
                
                ${stats.domainStats && stats.domainStats.length > 0 ? `
                    <div class="stats-section">
                        <h3>🌐 来源统计</h3>
                        <div class="stats-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>来源</th>
                                        <th>总数</th>
                                        <th>已完成</th>
                                        <th>完成率</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${stats.domainStats.map(s => `
                                        <tr>
                                            <td>${s.domain}</td>
                                            <td>${s.total}</td>
                                            <td>${s.completed}</td>
                                            <td>${s.completionRate}%</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    async renderSettings(params) {
        // Hide FAB
        this.updateFAB(false);
        
        const main = document.getElementById('main-content');
        
        const settings = await database.getSettings();
        const storageInfo = await backupManager.getStorageInfo();
        const blockedDomains = await recommendationEngine.getBlockedDomains();
        
        main.innerHTML = `
            <div class="settings-page">
                <div class="page-header">
                    <h2>⚙️ 设置</h2>
                </div>
                
                <div class="settings-section">
                    <h3>外观设置</h3>
                    <div class="setting-item">
                        <label>主题</label>
                        <select id="theme-select">
                            <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>浅色</option>
                            <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>深色</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>字体大小</label>
                        <input type="range" id="font-size" min="12" max="24" value="${settings.fontSize}">
                        <span id="font-size-value">${settings.fontSize}px</span>
                    </div>
                    <div class="setting-item">
                        <label>行高</label>
                        <input type="range" id="line-height" min="1.2" max="2.5" step="0.1" value="${settings.lineHeight}">
                        <span id="line-height-value">${settings.lineHeight}</span>
                    </div>
                </div>
                
                <div class="settings-section">
                    <h3>数据管理</h3>
                    ${storageInfo ? `
                        <div class="storage-info">
                            <p>存储使用: ${backupManager.formatBytes(storageInfo.usage)} / ${backupManager.formatBytes(storageInfo.quota)}</p>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${storageInfo.usagePercent}%"></div>
                            </div>
                        </div>
                    ` : ''}
                    <div class="setting-item">
                        <button class="btn" id="export-btn">📤 导出数据</button>
                    </div>
                    <div class="setting-item">
                        <button class="btn" id="import-btn">📥 导入数据</button>
                    </div>
                    <div class="setting-item">
                        <button class="btn btn-danger" id="clear-data-btn">🗑️ 清除所有数据</button>
                    </div>
                </div>
                
                ${blockedDomains.length > 0 ? `
                    <div class="settings-section">
                        <h3>屏蔽管理</h3>
                        <div class="blocked-domains">
                            ${blockedDomains.map(domain => `
                                <div class="blocked-domain-item">
                                    <span>${domain}</span>
                                    <button class="btn-link" onclick="app.unblockDomain('${domain}')">解除屏蔽</button>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
                
                <div class="settings-section">
                    <h3>关于</h3>
                    <p>稍后读 v1.0.0</p>
                    <p>纯前端阅读管理工具，所有数据存储在本地</p>
                </div>
            </div>
        `;

        // Settings handlers
        document.getElementById('theme-select').addEventListener('change', async (e) => {
            await database.updateSettings({ theme: e.target.value });
            UI.showToast('主题已更新', 'success');
        });

        document.getElementById('font-size').addEventListener('input', (e) => {
            document.getElementById('font-size-value').textContent = `${e.target.value}px`;
        });

        document.getElementById('font-size').addEventListener('change', async (e) => {
            await database.updateSettings({ fontSize: parseInt(e.target.value) });
            UI.showToast('字体大小已更新', 'success');
        });

        document.getElementById('line-height').addEventListener('input', (e) => {
            document.getElementById('line-height-value').textContent = e.target.value;
        });

        document.getElementById('line-height').addEventListener('change', async (e) => {
            await database.updateSettings({ lineHeight: parseFloat(e.target.value) });
            UI.showToast('行高已更新', 'success');
        });

        document.getElementById('export-btn').addEventListener('click', () => {
            backupManager.exportData();
        });

        document.getElementById('import-btn').addEventListener('click', () => {
            backupManager.showImportDialog();
        });

        document.getElementById('clear-data-btn').addEventListener('click', () => {
            backupManager.clearAllData();
        });
    }

    async unblockDomain(domain) {
        await recommendationEngine.unblockDomain(domain);
        this.renderSettings({});
    }
}

// Initialize app
const app = new App();
window.app = app;

export default app;

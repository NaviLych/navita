// UI utilities and components
export class UI {
    static showLoading() {
        document.getElementById('loading').classList.remove('hidden');
    }

    static hideLoading() {
        document.getElementById('loading').classList.add('hidden');
    }

    static showToast(message, type = 'info', duration = 3000) {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }

    static showModal(content, options = {}) {
        const overlay = document.getElementById('modal-overlay');
        const container = document.getElementById('modal-container');
        
        container.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${options.title || ''}</h3>
                    <button class="modal-close" onclick="window.UI.closeModal()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${options.footer ? `<div class="modal-footer">${options.footer}</div>` : ''}
            </div>
        `;
        
        overlay.classList.remove('hidden');
        container.classList.remove('hidden');
        
        // Close on overlay click
        overlay.onclick = () => this.closeModal();
    }

    static closeModal() {
        document.getElementById('modal-overlay').classList.add('hidden');
        document.getElementById('modal-container').classList.add('hidden');
    }

    static confirmDialog(message, onConfirm, onCancel = null) {
        const footer = `
            <button class="btn btn-secondary" onclick="window.UI.closeModal(); ${onCancel ? onCancel.toString() : ''}">取消</button>
            <button class="btn btn-primary" onclick="window.UI.closeModal(); (${onConfirm.toString()})()">确认</button>
        `;
        
        this.showModal(`<p>${message}</p>`, { title: '确认', footer });
    }

    static formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now - date;
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        
        if (days === 0) return '今天';
        if (days === 1) return '昨天';
        if (days < 7) return `${days}天前`;
        if (days < 30) return `${Math.floor(days / 7)}周前`;
        if (days < 365) return `${Math.floor(days / 30)}个月前`;
        return `${Math.floor(days / 365)}年前`;
    }

    static formatReadTime(minutes) {
        if (minutes < 1) return '少于1分钟';
        if (minutes < 60) return `${Math.round(minutes)}分钟`;
        const hours = Math.floor(minutes / 60);
        const mins = Math.round(minutes % 60);
        return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`;
    }

    static extractDomain(url) {
        try {
            const urlObj = new URL(url);
            return urlObj.hostname.replace('www.', '');
        } catch (e) {
            return url;
        }
    }

    static estimateReadTime(text) {
        // Average reading speed: 200-250 words per minute (Chinese: ~300 chars/min)
        const chars = text?.length || 0;
        return Math.max(1, Math.ceil(chars / 300));
    }

    static createArticleCard(article, readLaterItem = null) {
        const domain = this.extractDomain(article.url);
        const readTime = article.estReadTime || this.estimateReadTime(article.excerpt);
        const addedDate = readLaterItem ? this.formatDate(readLaterItem.addedAt) : this.formatDate(article.createdAt);
        
        const card = document.createElement('div');
        card.className = 'article-card';
        card.dataset.articleId = article.id;
        if (readLaterItem) {
            card.dataset.readLaterId = readLaterItem.id;
        }
        
        card.innerHTML = `
            ${article.cover ? `<div class="card-cover" style="background-image: url('${article.cover}')"></div>` : ''}
            <div class="card-content">
                <h3 class="card-title">${article.title || '无标题'}</h3>
                ${article.excerpt ? `<p class="card-excerpt">${article.excerpt.substring(0, 120)}...</p>` : ''}
                <div class="card-meta">
                    <span class="meta-domain">${domain}</span>
                    <span class="meta-time">${readTime}分钟</span>
                    <span class="meta-date">${addedDate}</span>
                </div>
                ${readLaterItem ? `
                    <div class="card-tags">
                        ${readLaterItem.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    ${readLaterItem.progress > 0 ? `
                        <div class="card-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${readLaterItem.progress}%"></div>
                            </div>
                            <span class="progress-text">${readLaterItem.progress}%</span>
                        </div>
                    ` : ''}
                ` : ''}
            </div>
            <div class="card-actions">
                ${readLaterItem ? `
                    <button class="btn-icon ${readLaterItem.starred ? 'active' : ''}" data-action="star" title="星标">⭐</button>
                    <button class="btn-icon" data-action="delete" title="删除">🗑️</button>
                ` : `
                    <button class="btn-icon" data-action="add-later" title="加入稍后读">📌</button>
                `}
                <button class="btn-icon" data-action="open" title="阅读">📖</button>
            </div>
        `;
        
        return card;
    }

    static createWaterfallLayout(cards, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = '';
        container.className = 'waterfall-container';
        
        // Create columns based on viewport width
        const columns = window.innerWidth < 768 ? 1 : window.innerWidth < 1024 ? 2 : 3;
        const columnElements = [];
        
        for (let i = 0; i < columns; i++) {
            const column = document.createElement('div');
            column.className = 'waterfall-column';
            container.appendChild(column);
            columnElements.push(column);
        }
        
        // Distribute cards to columns
        cards.forEach((card, index) => {
            const columnIndex = index % columns;
            columnElements[columnIndex].appendChild(card);
        });
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static showPointsAnimation(points, x, y) {
        const element = document.createElement('div');
        element.className = 'points-animation';
        element.textContent = `+${points}`;
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        
        document.body.appendChild(element);
        
        setTimeout(() => element.classList.add('animate'), 10);
        setTimeout(() => element.remove(), 1500);
    }

    static renderCalendar(year, month, checkins) {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startDay = firstDay.getDay();
        
        const checkinDates = new Set(checkins.map(c => c.date));
        
        let html = '<div class="calendar">';
        html += '<div class="calendar-header">';
        html += '<span class="calendar-nav" data-action="prev-month">◀</span>';
        html += `<span class="calendar-title">${year}年${month + 1}月</span>`;
        html += '<span class="calendar-nav" data-action="next-month">▶</span>';
        html += '</div>';
        html += '<div class="calendar-weekdays">';
        ['日', '一', '二', '三', '四', '五', '六'].forEach(day => {
            html += `<div class="weekday">${day}</div>`;
        });
        html += '</div>';
        html += '<div class="calendar-days">';
        
        // Empty cells before first day
        for (let i = 0; i < startDay; i++) {
            html += '<div class="calendar-day empty"></div>';
        }
        
        // Days of month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isChecked = checkinDates.has(date);
            const isToday = date === new Date().toISOString().split('T')[0];
            
            html += `<div class="calendar-day ${isChecked ? 'checked' : ''} ${isToday ? 'today' : ''}">${day}</div>`;
        }
        
        html += '</div></div>';
        return html;
    }

    static sanitizeHTML(html) {
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.innerHTML;
    }
}

// Make UI available globally for modal callbacks
window.UI = UI;

export default UI;

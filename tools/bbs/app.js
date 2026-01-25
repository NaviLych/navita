// BBS Forum Application
class BBSForum {
    constructor() {
        this.posts = this.loadPosts();
        this.currentPost = null;
        this.WELCOME_TITLE = '✨ 欢迎来到Reddit风格论坛';
        this.WELCOME_DESC = '使用投票系统发现最好的内容';
        this.WELCOME_ACTION = '点击上方"新建帖子"按钮开始创建你的第一个帖子！';
        this.initElements();
        this.initEventListeners();
        this.initTheme();
        this.render();
    }

    initElements() {
        // Buttons
        this.btnNewPost = document.getElementById('btnNewPost');
        this.btnCloseModal = document.getElementById('btnCloseModal');
        this.btnCancel = document.getElementById('btnCancel');
        this.btnSave = document.getElementById('btnSave');
        this.btnBack = document.getElementById('btnBack');
        this.btnCloseView = document.getElementById('btnCloseView');
        this.btnSubmitReply = document.getElementById('btnSubmitReply');
        this.themeToggle = document.getElementById('themeToggle');

        // Inputs
        this.inputTitle = document.getElementById('inputTitle');
        this.inputContent = document.getElementById('inputContent');
        this.inputAuthor = document.getElementById('inputAuthor');
        this.inputCategory = document.getElementById('inputCategory');
        this.inputReply = document.getElementById('inputReply');
        this.inputReplyAuthor = document.getElementById('inputReplyAuthor');
        this.inputIsOP = document.getElementById('inputIsOP');

        // Modals
        this.postModal = document.getElementById('postModal');
        this.viewModal = document.getElementById('viewModal');
        this.modalTitle = document.getElementById('modalTitle');

        // Containers
        this.postsContainer = document.getElementById('postsContainer');
        this.postDetail = document.getElementById('postDetail');
        this.repliesList = document.getElementById('repliesList');
        
        // Sort buttons
        this.sortButtons = document.querySelectorAll('.sort-btn');
        
        // Current sort mode
        this.currentSort = 'hot';
    }

    initEventListeners() {
        // New post
        this.btnNewPost.addEventListener('click', () => this.showNewPostModal());
        
        // Modal controls
        this.btnCloseModal.addEventListener('click', () => this.closePostModal());
        this.btnCancel.addEventListener('click', () => this.closePostModal());
        this.btnSave.addEventListener('click', () => this.savePost());
        this.btnBack.addEventListener('click', () => this.closeViewModal());
        this.btnCloseView.addEventListener('click', () => this.closeViewModal());
        
        // Reply
        this.btnSubmitReply.addEventListener('click', () => this.submitReply());
        
        // Theme toggle
        this.themeToggle.addEventListener('click', () => this.toggleTheme());
        
        // Sort buttons
        this.sortButtons.forEach(btn => {
            btn.addEventListener('click', (e) => this.changeSort(e.target.dataset.sort));
        });
        
        // Close modal on outside click
        this.postModal.addEventListener('click', (e) => {
            if (e.target === this.postModal) this.closePostModal();
        });
        this.viewModal.addEventListener('click', (e) => {
            if (e.target === this.viewModal) this.closeViewModal();
        });

        // Enter key in reply input
        this.inputReply.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.submitReply();
            }
        });
    }

    initTheme() {
        const savedTheme = localStorage.getItem('bbs-theme') || 'light';
        if (savedTheme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
            this.themeToggle.textContent = '☀️';
        }
    }

    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        this.themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
        localStorage.setItem('bbs-theme', newTheme);
    }

    loadPosts() {
        const stored = localStorage.getItem('bbs-posts');
        return stored ? JSON.parse(stored) : [];
    }

    savePosts() {
        localStorage.setItem('bbs-posts', JSON.stringify(this.posts));
    }

    showNewPostModal() {
        this.currentPost = null;
        this.modalTitle.textContent = '新建帖子';
        this.inputTitle.value = '';
        this.inputContent.value = '';
        this.inputAuthor.value = '';
        this.inputCategory.value = 'general';
        this.postModal.classList.add('active');
        this.inputTitle.focus();
    }

    closePostModal() {
        this.postModal.classList.remove('active');
    }

    closeViewModal() {
        this.viewModal.classList.remove('active');
        this.currentPost = null;
    }

    savePost() {
        const title = this.inputTitle.value.trim();
        const content = this.inputContent.value.trim();
        const author = this.inputAuthor.value.trim() || '匿名网友';
        const category = this.inputCategory.value;

        if (!title) {
            alert('请输入帖子标题');
            return;
        }

        if (!content) {
            alert('请输入帖子内容');
            return;
        }

        const post = {
            id: Date.now(),
            title,
            content,
            author,
            category,
            time: new Date().toISOString(),
            upvotes: 0,
            downvotes: 0,
            replies: [],
            upvotedBy: [],
            downvotedBy: []
        };

        this.posts.unshift(post);
        this.savePosts();
        this.render();
        this.closePostModal();
    }

    deletePost(id) {
        if (confirm('确定要删除这个帖子吗？')) {
            this.posts = this.posts.filter(p => p.id !== id);
            this.savePosts();
            this.render();
        }
    }

    upvotePost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        const userId = this.getUserId();
        
        // Initialize vote arrays if they don't exist (for old posts)
        if (!post.upvotedBy) post.upvotedBy = [];
        if (!post.downvotedBy) post.downvotedBy = [];
        if (!post.upvotes) post.upvotes = 0;
        if (!post.downvotes) post.downvotes = 0;
        
        const upvotedIndex = post.upvotedBy.indexOf(userId);
        const downvotedIndex = post.downvotedBy.indexOf(userId);

        // Remove downvote if exists
        if (downvotedIndex > -1) {
            post.downvotedBy.splice(downvotedIndex, 1);
            post.downvotes--;
        }

        // Toggle upvote
        if (upvotedIndex > -1) {
            post.upvotedBy.splice(upvotedIndex, 1);
            post.upvotes--;
        } else {
            post.upvotedBy.push(userId);
            post.upvotes++;
        }

        this.savePosts();
        this.render();
    }

    downvotePost(postId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        const userId = this.getUserId();
        
        // Initialize vote arrays if they don't exist (for old posts)
        if (!post.upvotedBy) post.upvotedBy = [];
        if (!post.downvotedBy) post.downvotedBy = [];
        if (!post.upvotes) post.upvotes = 0;
        if (!post.downvotes) post.downvotes = 0;
        
        const upvotedIndex = post.upvotedBy.indexOf(userId);
        const downvotedIndex = post.downvotedBy.indexOf(userId);

        // Remove upvote if exists
        if (upvotedIndex > -1) {
            post.upvotedBy.splice(upvotedIndex, 1);
            post.upvotes--;
        }

        // Toggle downvote
        if (downvotedIndex > -1) {
            post.downvotedBy.splice(downvotedIndex, 1);
            post.downvotes--;
        } else {
            post.downvotedBy.push(userId);
            post.downvotes++;
        }

        this.savePosts();
        this.render();
    }

    viewPost(id) {
        const post = this.posts.find(p => p.id === id);
        if (!post) return;

        this.currentPost = post;
        this.renderPostDetail(post);
        this.viewModal.classList.add('active');
    }

    renderPostDetail(post) {
        const userId = this.getUserId();
        
        // Initialize vote arrays if they don't exist (for old posts)
        if (!post.upvotedBy) post.upvotedBy = [];
        if (!post.downvotedBy) post.downvotedBy = [];
        if (!post.upvotes) post.upvotes = 0;
        if (!post.downvotes) post.downvotes = 0;
        
        const hasUpvoted = post.upvotedBy.includes(userId);
        const hasDownvoted = post.downvotedBy.includes(userId);
        const score = post.upvotes - post.downvotes;

        this.postDetail.innerHTML = `
            <div class="post-header">
                <h1 class="post-title">${this.escapeHtml(post.title)}</h1>
            </div>
            <div class="post-meta">
                <span class="post-category">${this.getCategoryDisplay(post.category || 'general')}</span>
                <span class="post-author">👤 ${this.escapeHtml(post.author)}</span>
                <span class="post-time">🕐 ${this.formatTime(post.time)}</span>
            </div>
            <div class="post-content">${this.escapeHtml(post.content)}</div>
            <div class="post-footer">
                <div class="vote-controls">
                    <button class="vote-btn upvote ${hasUpvoted ? 'active' : ''}" onclick="forum.upvotePostDetail(${post.id})">⬆</button>
                    <span class="vote-score ${score > 0 ? 'positive' : score < 0 ? 'negative' : ''}">${score}</span>
                    <button class="vote-btn downvote ${hasDownvoted ? 'active' : ''}" onclick="forum.downvotePostDetail(${post.id})">⬇</button>
                </div>
                <div class="post-stat">
                    <span class="post-stat-icon">💬</span>
                    <span>${post.replies.length}</span>
                </div>
            </div>
        `;

        this.renderReplies(post);
    }

    renderReplies(post) {
        if (post.replies.length === 0) {
            this.repliesList.innerHTML = '<div class="empty-state">暂无回复，快来抢沙发吧！</div>';
            return;
        }

        const userId = this.getUserId();
        this.repliesList.innerHTML = post.replies.map((reply, index) => {
            // Initialize vote arrays if they don't exist (for old replies)
            if (!reply.upvotedBy) reply.upvotedBy = [];
            if (!reply.downvotedBy) reply.downvotedBy = [];
            if (!reply.upvotes) reply.upvotes = 0;
            if (!reply.downvotes) reply.downvotes = 0;
            
            const hasUpvoted = reply.upvotedBy.includes(userId);
            const hasDownvoted = reply.downvotedBy.includes(userId);
            const score = reply.upvotes - reply.downvotes;
            // Validate isOP is boolean before using in template
            const isOP = reply.isOP === true;
            const opBadge = isOP ? '<span class="op-badge">楼主</span>' : '';
            return `
                <div class="reply-item">
                    <div class="reply-vote">
                        <button class="vote-btn-small upvote ${hasUpvoted ? 'active' : ''}" onclick="forum.upvoteReply(${post.id}, ${reply.id})">⬆</button>
                        <span class="vote-score-small ${score > 0 ? 'positive' : score < 0 ? 'negative' : ''}">${score}</span>
                        <button class="vote-btn-small downvote ${hasDownvoted ? 'active' : ''}" onclick="forum.downvoteReply(${post.id}, ${reply.id})">⬇</button>
                    </div>
                    <div class="reply-main">
                        <div class="reply-header">
                            <span class="reply-author">${index + 1}楼 · ${this.escapeHtml(reply.author)} ${opBadge}</span>
                            <span class="reply-time">${this.formatTime(reply.time)}</span>
                        </div>
                        <div class="reply-content">${this.escapeHtml(reply.content)}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    submitReply() {
        if (!this.currentPost) return;

        const content = this.inputReply.value.trim();
        const author = this.inputReplyAuthor.value.trim() || '匿名网友';
        const isOP = this.inputIsOP.checked;

        if (!content) {
            alert('请输入回复内容');
            return;
        }

        const reply = {
            id: Date.now(),
            content,
            author,
            time: new Date().toISOString(),
            upvotes: 0,
            downvotes: 0,
            upvotedBy: [],
            downvotedBy: [],
            isOP: isOP
        };

        const post = this.posts.find(p => p.id === this.currentPost.id);
        if (post) {
            post.replies.push(reply);
            this.savePosts();
            this.currentPost = post;
            this.renderPostDetail(post);
            this.inputReply.value = '';
            this.inputReplyAuthor.value = '';
            this.inputIsOP.checked = false;
        }
    }

    upvoteReply(postId, replyId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        const reply = post.replies.find(r => r.id === replyId);
        if (!reply) return;

        const userId = this.getUserId();
        
        // Initialize vote arrays if they don't exist (for old replies)
        if (!reply.upvotedBy) reply.upvotedBy = [];
        if (!reply.downvotedBy) reply.downvotedBy = [];
        if (!reply.upvotes) reply.upvotes = 0;
        if (!reply.downvotes) reply.downvotes = 0;
        
        const upvotedIndex = reply.upvotedBy.indexOf(userId);
        const downvotedIndex = reply.downvotedBy.indexOf(userId);

        // Remove downvote if exists
        if (downvotedIndex > -1) {
            reply.downvotedBy.splice(downvotedIndex, 1);
            reply.downvotes--;
        }

        // Toggle upvote
        if (upvotedIndex > -1) {
            reply.upvotedBy.splice(upvotedIndex, 1);
            reply.upvotes--;
        } else {
            reply.upvotedBy.push(userId);
            reply.upvotes++;
        }

        this.savePosts();
        this.currentPost = post;
        this.renderReplies(post);
    }

    downvoteReply(postId, replyId) {
        const post = this.posts.find(p => p.id === postId);
        if (!post) return;

        const reply = post.replies.find(r => r.id === replyId);
        if (!reply) return;

        const userId = this.getUserId();
        
        // Initialize vote arrays if they don't exist (for old replies)
        if (!reply.upvotedBy) reply.upvotedBy = [];
        if (!reply.downvotedBy) reply.downvotedBy = [];
        if (!reply.upvotes) reply.upvotes = 0;
        if (!reply.downvotes) reply.downvotes = 0;
        
        const upvotedIndex = reply.upvotedBy.indexOf(userId);
        const downvotedIndex = reply.downvotedBy.indexOf(userId);

        // Remove upvote if exists
        if (upvotedIndex > -1) {
            reply.upvotedBy.splice(upvotedIndex, 1);
            reply.upvotes--;
        }

        // Toggle downvote
        if (downvotedIndex > -1) {
            reply.downvotedBy.splice(downvotedIndex, 1);
            reply.downvotes--;
        } else {
            reply.downvotedBy.push(userId);
            reply.downvotes++;
        }

        this.savePosts();
        this.currentPost = post;
        this.renderReplies(post);
    }

    upvotePostDetail(postId) {
        this.upvotePost(postId);
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            this.currentPost = post;
            this.renderPostDetail(post);
        }
    }

    downvotePostDetail(postId) {
        this.downvotePost(postId);
        const post = this.posts.find(p => p.id === postId);
        if (post) {
            this.currentPost = post;
            this.renderPostDetail(post);
        }
    }

    getUserId() {
        let userId = localStorage.getItem('bbs-user-id');
        if (!userId) {
            userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
            localStorage.setItem('bbs-user-id', userId);
        }
        return userId;
    }

    changeSort(sortType) {
        this.currentSort = sortType;
        this.sortButtons.forEach(btn => {
            if (btn.dataset.sort === sortType) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        this.render();
    }

    getSortedPosts() {
        const posts = [...this.posts];
        
        switch (this.currentSort) {
            case 'hot':
                // Hot algorithm: (score + 1) / (age in hours + 2)^1.5
                // Adding 1 to score ensures positive scores get boosted
                return posts.sort((a, b) => {
                    const scoreA = Math.max((a.upvotes || 0) - (a.downvotes || 0), 0) + 1;
                    const scoreB = Math.max((b.upvotes || 0) - (b.downvotes || 0), 0) + 1;
                    const ageA = (Date.now() - new Date(a.time)) / 3600000 + 2;
                    const ageB = (Date.now() - new Date(b.time)) / 3600000 + 2;
                    const hotA = scoreA / Math.pow(ageA, 1.5);
                    const hotB = scoreB / Math.pow(ageB, 1.5);
                    return hotB - hotA;
                });
            case 'new':
                return posts.sort((a, b) => new Date(b.time) - new Date(a.time));
            case 'top':
                return posts.sort((a, b) => {
                    const scoreA = (a.upvotes || 0) - (a.downvotes || 0);
                    const scoreB = (b.upvotes || 0) - (b.downvotes || 0);
                    return scoreB - scoreA;
                });
            default:
                return posts;
        }
    }

    getCategoryDisplay(category) {
        const categories = {
            'general': '🌐 综合讨论',
            'tech': '💻 技术',
            'life': '🌱 生活',
            'entertainment': '🎮 娱乐',
            'news': '📰 新闻',
            'question': '❓ 提问'
        };
        return categories[category] || categories['general'];
    }

    render() {
        const welcomeCard = this.postsContainer.querySelector('.welcome-card');
        
        if (this.posts.length === 0) {
            if (!welcomeCard) {
                this.postsContainer.innerHTML = `
                    <div class="welcome-card">
                        <h2>${this.WELCOME_TITLE}</h2>
                        <p>${this.WELCOME_DESC}</p>
                        <p>${this.WELCOME_ACTION}</p>
                    </div>
                `;
            }
            return;
        }

        if (welcomeCard) {
            welcomeCard.remove();
        }

        const userId = this.getUserId();
        const sortedPosts = this.getSortedPosts();
        
        this.postsContainer.innerHTML = sortedPosts.map(post => {
            // Initialize vote arrays if they don't exist (for old posts)
            if (!post.upvotedBy) post.upvotedBy = [];
            if (!post.downvotedBy) post.downvotedBy = [];
            if (!post.upvotes) post.upvotes = 0;
            if (!post.downvotes) post.downvotes = 0;
            
            const hasUpvoted = post.upvotedBy.includes(userId);
            const hasDownvoted = post.downvotedBy.includes(userId);
            const score = post.upvotes - post.downvotes;
            
            return `
                <div class="post-card">
                    <div class="post-vote-column">
                        <button class="vote-btn upvote ${hasUpvoted ? 'active' : ''}" onclick="event.stopPropagation(); forum.upvotePost(${post.id})">⬆</button>
                        <span class="vote-score ${score > 0 ? 'positive' : score < 0 ? 'negative' : ''}">${score}</span>
                        <button class="vote-btn downvote ${hasDownvoted ? 'active' : ''}" onclick="event.stopPropagation(); forum.downvotePost(${post.id})">⬇</button>
                    </div>
                    <div class="post-main">
                        <div class="post-header">
                            <div>
                                <div class="post-meta-top">
                                    <span class="post-category">${this.getCategoryDisplay(post.category || 'general')}</span>
                                    <span class="post-author">👤 ${this.escapeHtml(post.author)}</span>
                                    <span class="post-time">🕐 ${this.formatTime(post.time)}</span>
                                </div>
                                <h2 class="post-title" onclick="forum.viewPost(${post.id})">${this.escapeHtml(post.title)}</h2>
                            </div>
                            <div class="post-actions">
                                <button class="btn-action btn-delete" onclick="event.stopPropagation(); forum.deletePost(${post.id})" title="删除">🗑️</button>
                            </div>
                        </div>
                        <div class="post-content" onclick="forum.viewPost(${post.id})">${this.escapeHtml(post.content)}</div>
                        <div class="post-footer">
                            <div class="post-stat" onclick="forum.viewPost(${post.id})">
                                <span class="post-stat-icon">💬</span>
                                <span>${post.replies.length} 回复</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    formatTime(isoString) {
        const date = new Date(isoString);
        const now = new Date();
        const diff = now - date;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return '刚刚';
        if (minutes < 60) return `${minutes}分钟前`;
        if (hours < 24) return `${hours}小时前`;
        if (days < 7) return `${days}天前`;

        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }
}

// Initialize the forum
const forum = new BBSForum();

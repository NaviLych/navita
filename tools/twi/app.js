// State management
let tweets = [];
let theme = 'light';
let toastTimeout = null;

// IndexedDB configuration
const DB_NAME = 'twi-db';
const DB_VERSION = 1;
const STORE_NAME = 'tweets';
let db = null;

// DOM elements
const composeTextarea = document.getElementById('composeTextarea');
const tweetBtn = document.getElementById('tweetBtn');
const charCounter = document.getElementById('charCounter');
const charCount = document.querySelector('.char-count');
const timeline = document.getElementById('timeline');
const emptyState = document.getElementById('emptyState');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');
const totalTweetsEl = document.getElementById('totalTweets');
const totalLikesEl = document.getElementById('totalLikes');
const toast = document.getElementById('toast');

// Initialize app
async function init() {
    loadTheme();
    await initDB();
    await loadTweets();
    renderTimeline();
    updateStats();
    attachEventListeners();
}

// Event listeners
function attachEventListeners() {
    // Compose textarea
    composeTextarea.addEventListener('input', handleTextareaInput);
    
    // Tweet button
    tweetBtn.addEventListener('click', handleTweetSubmit);
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Enter key to submit (with Shift+Enter for new line)
    composeTextarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!tweetBtn.disabled) {
                handleTweetSubmit();
            }
        }
    });
}

// Handle textarea input
function handleTextareaInput() {
    const text = composeTextarea.value;
    const length = text.length;
    
    // Update character counter
    charCount.textContent = length;
    
    // Update counter styling
    charCounter.classList.remove('warning', 'error');
    if (length > 260) {
        charCounter.classList.add('warning');
    }
    if (length > 280) {
        charCounter.classList.add('error');
    }
    
    // Enable/disable tweet button
    tweetBtn.disabled = length === 0 || length > 280;
}

// Handle tweet submission
function handleTweetSubmit() {
    const text = composeTextarea.value.trim();
    
    if (text.length === 0 || text.length > 280) {
        return;
    }
    
    // Create new tweet with more robust ID generation
    const tweet = {
        id: Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        text: text,
        timestamp: new Date().toISOString(),
        likes: 0,
        liked: false
    };
    
    // Add to tweets array
    tweets.unshift(tweet);
    
    // Save to IndexedDB
    saveTweets();
    
    // Clear textarea
    composeTextarea.value = '';
    charCount.textContent = '0';
    tweetBtn.disabled = true;
    charCounter.classList.remove('warning', 'error');
    
    // Re-render timeline
    renderTimeline();
    updateStats();
    
    // Show success toast
    showToast('推文已发布！');
    
    // Focus back on textarea
    composeTextarea.focus();
}

// Render timeline
// Note: Full re-render is used for simplicity. For a small app with IndexedDB
// constraints (typically thousands of tweets), this is acceptable performance-wise.
function renderTimeline() {
    // Clear timeline
    timeline.innerHTML = '';
    
    // Show empty state if no tweets
    if (tweets.length === 0) {
        emptyState.classList.add('show');
        return;
    }
    
    emptyState.classList.remove('show');
    
    // Render each tweet
    tweets.forEach(tweet => {
        const tweetEl = createTweetElement(tweet);
        timeline.appendChild(tweetEl);
    });
}

// Create tweet element
function createTweetElement(tweet) {
    const tweetEl = document.createElement('article');
    tweetEl.className = 'tweet';
    tweetEl.dataset.id = tweet.id;
    
    const timeAgo = getTimeAgo(new Date(tweet.timestamp));
    
    tweetEl.innerHTML = `
        <div class="tweet-container">
            <div class="tweet-avatar">
                <div class="avatar">📝</div>
            </div>
            <div class="tweet-content">
                <div class="tweet-header">
                    <span class="tweet-author">我</span>
                    <span class="tweet-date">· ${timeAgo}</span>
                </div>
                <div class="tweet-text">${escapeHtml(tweet.text)}</div>
                <div class="tweet-actions">
                    <button class="action-btn like-btn ${tweet.liked ? 'liked' : ''}" data-action="like">
                        <span class="action-icon">${tweet.liked ? '❤️' : '🤍'}</span>
                        <span class="action-count">${tweet.likes > 0 ? tweet.likes : ''}</span>
                    </button>
                    <button class="action-btn delete-btn" data-action="delete">
                        <span class="action-icon">🗑️</span>
                        <span class="action-text">删除</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Attach action listeners
    const likeBtn = tweetEl.querySelector('.like-btn');
    const deleteBtn = tweetEl.querySelector('.delete-btn');
    
    likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleLike(tweet.id);
    });
    
    deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleDelete(tweet.id);
    });
    
    return tweetEl;
}

// Handle like
function handleLike(tweetId) {
    const tweet = tweets.find(t => t.id === tweetId);
    if (!tweet) return;
    
    tweet.liked = !tweet.liked;
    tweet.likes = tweet.liked ? tweet.likes + 1 : tweet.likes - 1;
    
    saveTweets();
    renderTimeline();
    updateStats();
}

// Handle delete
function handleDelete(tweetId) {
    if (!confirm('确定要删除这条推文吗？')) {
        return;
    }
    
    tweets = tweets.filter(t => t.id !== tweetId);
    saveTweets();
    renderTimeline();
    updateStats();
    showToast('推文已删除');
}

// Update statistics
function updateStats() {
    totalTweetsEl.textContent = tweets.length;
    const totalLikes = tweets.reduce((sum, tweet) => sum + tweet.likes, 0);
    totalLikesEl.textContent = totalLikes;
}

// IndexedDB initialization and management
function initDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = () => {
            console.error('Failed to open IndexedDB:', request.error);
            showToast('数据库初始化失败');
            reject(request.error);
        };
        
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            
            // Create object store if it doesn't exist
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            }
        };
    });
}

function saveTweets() {
    if (!db) {
        console.error('Database not initialized');
        showToast('保存失败：数据库未初始化');
        return Promise.reject(new Error('Database not initialized'));
    }
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(STORE_NAME);
        
        // Clear existing data
        const clearRequest = objectStore.clear();
        
        clearRequest.onsuccess = () => {
            // Add all tweets
            let addedCount = 0;
            tweets.forEach(tweet => {
                const addRequest = objectStore.add(tweet);
                addRequest.onsuccess = () => {
                    addedCount++;
                    if (addedCount === tweets.length) {
                        resolve();
                    }
                };
                addRequest.onerror = () => {
                    console.error('Failed to add tweet:', addRequest.error);
                };
            });
            
            // Handle empty tweets array
            if (tweets.length === 0) {
                resolve();
            }
        };
        
        clearRequest.onerror = () => {
            console.error('Failed to clear tweets:', clearRequest.error);
            showToast('保存失败');
            reject(clearRequest.error);
        };
        
        transaction.onerror = () => {
            console.error('Transaction failed:', transaction.error);
            showToast('保存失败');
            reject(transaction.error);
        };
    });
}

function loadTweets() {
    if (!db) {
        console.error('Database not initialized');
        return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(STORE_NAME);
        const request = objectStore.getAll();
        
        request.onsuccess = () => {
            tweets = request.result || [];
            // Sort tweets by timestamp (newest first)
            tweets.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            resolve(tweets);
        };
        
        request.onerror = () => {
            console.error('Failed to load tweets:', request.error);
            tweets = [];
            reject(request.error);
        };
    });
}

// Theme management
function loadTheme() {
    const savedTheme = localStorage.getItem('twi-theme') || 'light';
    theme = savedTheme;
    applyTheme(theme);
}

function toggleTheme() {
    theme = theme === 'light' ? 'dark' : 'light';
    applyTheme(theme);
    localStorage.setItem('twi-theme', theme);
    showToast(`已切换到${theme === 'dark' ? '深色' : '浅色'}模式`);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
    } else {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
    }
}

// Utility functions
function getTimeAgo(date) {
    const now = new Date();
    const diff = now - date;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (seconds < 60) {
        return '刚刚';
    } else if (minutes < 60) {
        return `${minutes}分钟前`;
    } else if (hours < 24) {
        return `${hours}小时前`;
    } else if (days < 7) {
        return `${days}天前`;
    } else {
        return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message) {
    // Clear any existing toast timeout
    if (toastTimeout) {
        clearTimeout(toastTimeout);
        toast.classList.remove('show');
    }
    
    toast.textContent = message;
    toast.classList.add('show');
    
    toastTimeout = setTimeout(() => {
        toast.classList.remove('show');
        toastTimeout = null;
    }, 3000);
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

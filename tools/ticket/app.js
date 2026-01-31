// State management
let todos = [];
try {
    todos = JSON.parse(localStorage.getItem('todos')) || [];
} catch (e) {
    console.error('Failed to parse todos from localStorage:', e);
    todos = [];
}

const state = {
    theme: localStorage.getItem('theme') || 'light',
    todos: todos,
    currentTodoId: null,
    timerRunning: false,
    timerSeconds: 0,
    timerInterval: null,
    lastSaveTime: 0
};

// DOM elements
const elements = {
    // List view
    listView: document.getElementById('listView'),
    todoInput: document.getElementById('todoInput'),
    addBtn: document.getElementById('addBtn'),
    todoList: document.getElementById('todoList'),
    emptyState: document.getElementById('emptyState'),
    themeToggle: document.getElementById('themeToggle'),
    todoCount: document.getElementById('todoCount'),
    
    // Focus view
    focusView: document.getElementById('focusView'),
    backBtn: document.getElementById('backBtn'),
    ticketDate: document.getElementById('ticketDate'),
    ticketNumber: document.getElementById('ticketNumber'),
    ticketTaskName: document.getElementById('ticketTaskName'),
    timerDisplay: document.getElementById('timerDisplay'),
    timerProgress: document.getElementById('timerProgress'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    themeToggleFocus: document.getElementById('themeToggleFocus'),
    completionSection: document.getElementById('completionSection'),
    completeBtn: document.getElementById('completeBtn')
};

// Initialize app
function init() {
    // Set initial theme
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();

    // Event listeners
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.themeToggleFocus.addEventListener('click', toggleTheme);
    elements.addBtn.addEventListener('click', addTodo);
    elements.todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addTodo();
        }
    });
    elements.backBtn.addEventListener('click', backToList);
    elements.startBtn.addEventListener('click', startTimer);
    elements.pauseBtn.addEventListener('click', pauseTimer);
    elements.resetBtn.addEventListener('click', resetTimer);
    elements.completeBtn.addEventListener('click', completeTodo);

    // Render todos
    renderTodos();
}

// Theme management
function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
    updateThemeIcon();
}

function updateThemeIcon() {
    // Icons are handled via CSS mask-image based on data-theme
}

// Todo management
function addTodo() {
    const text = elements.todoInput.value.trim();
    if (!text) return;

    const todo = {
        id: Date.now() + Math.random(), // Add entropy to prevent collisions
        name: text,
        createdAt: new Date().toISOString(),
        totalTime: 0 // in seconds
    };

    state.todos.unshift(todo);
    saveTodos();
    renderTodos();
    
    elements.todoInput.value = '';
    elements.todoInput.blur();
}

function deleteTodo(id) {
    if (confirm('确定要删除这个任务吗？')) {
        state.todos = state.todos.filter(todo => todo.id !== id);
        saveTodos();
        renderTodos();
    }
}

function startFocus(id) {
    const todo = state.todos.find(t => t.id === id);
    if (!todo) return;

    state.currentTodoId = id;
    
    // Update ticket info
    elements.ticketNumber.textContent = formatTicketNumber(id);
    elements.ticketTaskName.textContent = todo.name;
    elements.ticketDate.textContent = formatDate(new Date());
    
    // Load saved time
    state.timerSeconds = todo.totalTime || 0;
    updateTimerDisplay();
    updateTimerProgress();
    
    // Switch to focus view
    elements.listView.classList.add('hidden');
    elements.focusView.classList.remove('hidden');
}

function backToList() {
    // Stop timer if running
    if (state.timerRunning) {
        pauseTimer();
    }
    
    // Hide completion section
    elements.completionSection.classList.add('hidden');
    
    // Switch back to list view
    elements.focusView.classList.add('hidden');
    elements.listView.classList.remove('hidden');
    
    state.currentTodoId = null;
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(state.todos));
}

function renderTodos() {
    // Update count
    const count = state.todos.length;
    elements.todoCount.textContent = `${count} 个任务`;
    
    if (count === 0) {
        elements.emptyState.classList.add('visible');
        elements.todoList.innerHTML = '';
        return;
    }

    elements.emptyState.classList.remove('visible');
    
    elements.todoList.innerHTML = state.todos.map(todo => `
        <div class="todo-item">
            <div class="todo-ticket-icon">
                <span>🎫</span>
            </div>
            <div class="todo-content">
                <div class="todo-name">${escapeHtml(todo.name)}</div>
                <div class="todo-meta">
                    <span class="todo-time-badge">
                        <span>⏱</span>
                        <span>${formatTimeShort(todo.totalTime || 0)}</span>
                    </span>
                </div>
            </div>
            <div class="todo-actions">
                <button class="take-btn" onclick="startFocus(${todo.id})">
                    <span>取号</span>
                </button>
                <button class="delete-btn" onclick="deleteTodo(${todo.id})">
                    <span class="delete-icon"></span>
                </button>
            </div>
        </div>
    `).join('');
}

// Timer management
function startTimer() {
    if (state.timerRunning) return;
    
    state.timerRunning = true;
    elements.startBtn.classList.add('hidden');
    elements.pauseBtn.classList.remove('hidden');
    
    // Hide completion section when timer starts
    elements.completionSection.classList.add('hidden');
    
    state.timerInterval = setInterval(() => {
        state.timerSeconds++;
        updateTimerDisplay();
        updateTimerProgress();
        // Throttle localStorage writes to every 10 seconds
        const now = Date.now();
        if (now - state.lastSaveTime >= 10000) {
            saveCurrentTodoTime();
            state.lastSaveTime = now;
        }
    }, 1000);
}

function pauseTimer() {
    if (!state.timerRunning) return;
    
    state.timerRunning = false;
    elements.startBtn.classList.remove('hidden');
    elements.pauseBtn.classList.add('hidden');
    
    if (state.timerInterval) {
        clearInterval(state.timerInterval);
        state.timerInterval = null;
    }
    
    saveCurrentTodoTime();
    
    // Show completion option when timer is paused
    elements.completionSection.classList.remove('hidden');
}

function resetTimer() {
    const confirmReset = confirm('确定要重置计时器吗？这不会删除已保存的时间。');
    if (!confirmReset) return;
    
    // Stop timer if running
    if (state.timerRunning) {
        pauseTimer();
    }
    
    // Reset display
    state.timerSeconds = 0;
    updateTimerDisplay();
    
    // Show completion option when resetting
    elements.completionSection.classList.remove('hidden');
}

function completeTodo() {
    if (state.currentTodoId === null) return;
    
    const todo = state.todos.find(t => t.id === state.currentTodoId);
    if (!todo) return;
    
    const confirmComplete = confirm(`确定要完成任务"${todo.name}"吗？完成后将从列表中移除。`);
    if (!confirmComplete) return;
    
    // Stop timer if running (without showing completion section)
    if (state.timerRunning) {
        state.timerRunning = false;
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }
        saveCurrentTodoTime();
    }
    
    // Remove the todo from the list
    state.todos = state.todos.filter(t => t.id !== state.currentTodoId);
    saveTodos();
    
    // Return to list view
    elements.focusView.classList.add('hidden');
    elements.listView.classList.remove('hidden');
    
    state.currentTodoId = null;
    state.timerSeconds = 0;
    
    // Hide completion section
    elements.completionSection.classList.add('hidden');
    
    // Refresh the todo list
    renderTodos();
}

function saveCurrentTodoTime() {
    if (state.currentTodoId === null) return;
    
    const todo = state.todos.find(t => t.id === state.currentTodoId);
    if (todo) {
        todo.totalTime = state.timerSeconds;
        saveTodos();
    }
}

function updateTimerDisplay() {
    const hours = Math.floor(state.timerSeconds / 3600);
    const minutes = Math.floor((state.timerSeconds % 3600) / 60);
    const seconds = state.timerSeconds % 60;
    
    // Show hours only if > 0
    if (hours > 0) {
        elements.timerDisplay.textContent = 
            `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
    } else {
        elements.timerDisplay.textContent = 
            `${padZero(minutes)}:${padZero(seconds)}`;
    }
}

function updateTimerProgress() {
    // Progress based on 60-minute cycle (Pomodoro-like)
    const cycleSeconds = 60 * 60; // 1 hour cycle
    const progress = (state.timerSeconds % cycleSeconds) / cycleSeconds;
    const circumference = 2 * Math.PI * 90; // r=90 from SVG
    const offset = circumference * (1 - progress);
    
    if (elements.timerProgress) {
        elements.timerProgress.style.strokeDashoffset = offset;
    }
}

// Utility functions
function formatTicketNumber(id) {
    // Generate a ticket number like A001, B023, etc.
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const idInt = Math.floor(id); // Convert to integer
    const num = idInt % 1000;
    const letter = letters[Math.floor((idInt / 1000) % 26)];
    return `${letter}${String(num).padStart(3, '0')}`;
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = padZero(date.getMonth() + 1);
    const day = padZero(date.getDate());
    const hours = padZero(date.getHours());
    const minutes = padZero(date.getMinutes());
    return `${year}年${month}月${day}日 ${hours}:${minutes}`;
}

function formatTime(seconds) {
    if (seconds === 0) return '0分钟';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
    }
    return `${minutes}分钟`;
}

function formatTimeShort(seconds) {
    if (seconds === 0) return '0分';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}时${minutes}分`;
    }
    return `${minutes}分`;
}

function padZero(num) {
    return String(num).padStart(2, '0');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Make functions globally accessible for onclick handlers
window.startFocus = startFocus;
window.deleteTodo = deleteTodo;

// Clean up timer on page unload
window.addEventListener('beforeunload', () => {
    if (state.timerRunning) {
        saveCurrentTodoTime();
    }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

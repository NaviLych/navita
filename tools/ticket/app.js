// State management
let todos = [];
let projects = [];
let completedRecords = [];

try {
    todos = JSON.parse(localStorage.getItem('todos')) || [];
    projects = JSON.parse(localStorage.getItem('projects')) || [];
    completedRecords = JSON.parse(localStorage.getItem('completedRecords')) || [];
} catch (e) {
    console.error('Failed to parse data from localStorage:', e);
    todos = [];
    projects = [];
    completedRecords = [];
}

const state = {
    theme: localStorage.getItem('theme') || 'light',
    todos: todos,
    projects: projects,
    completedRecords: completedRecords,
    currentTodoId: null,
    timerRunning: false,
    timerSeconds: 0,
    timerInterval: null,
    lastSaveTime: 0,
    currentPeriod: 'today',
    selectedProjectColor: '#ff6b35'
};

// DOM elements
const elements = {
    // Tab bar
    tabBar: document.getElementById('tabBar'),
    
    // List view
    listView: document.getElementById('listView'),
    todoInput: document.getElementById('todoInput'),
    projectSelect: document.getElementById('projectSelect'),
    addBtn: document.getElementById('addBtn'),
    todoList: document.getElementById('todoList'),
    emptyState: document.getElementById('emptyState'),
    themeToggle: document.getElementById('themeToggle'),
    todoCount: document.getElementById('todoCount'),
    
    // Account view
    accountView: document.getElementById('accountView'),
    themeToggleAccount: document.getElementById('themeToggleAccount'),
    totalBalance: document.getElementById('totalBalance'),
    completedCount: document.getElementById('completedCount'),
    periodTime: document.getElementById('periodTime'),
    periodTasks: document.getElementById('periodTasks'),
    periodAvg: document.getElementById('periodAvg'),
    periodSessions: document.getElementById('periodSessions'),
    projectsList: document.getElementById('projectsList'),
    emptyProjects: document.getElementById('emptyProjects'),
    recordsList: document.getElementById('recordsList'),
    emptyRecords: document.getElementById('emptyRecords'),
    addProjectBtn: document.getElementById('addProjectBtn'),
    
    // Focus view
    focusView: document.getElementById('focusView'),
    backBtn: document.getElementById('backBtn'),
    ticketDate: document.getElementById('ticketDate'),
    ticketNumber: document.getElementById('ticketNumber'),
    ticketTaskName: document.getElementById('ticketTaskName'),
    ticketBranch: document.getElementById('ticketBranch'),
    timerDisplay: document.getElementById('timerDisplay'),
    timerProgress: document.getElementById('timerProgress'),
    startBtn: document.getElementById('startBtn'),
    pauseBtn: document.getElementById('pauseBtn'),
    resetBtn: document.getElementById('resetBtn'),
    themeToggleFocus: document.getElementById('themeToggleFocus'),
    completionSection: document.getElementById('completionSection'),
    completeBtn: document.getElementById('completeBtn'),
    
    // Modal
    projectModal: document.getElementById('projectModal'),
    projectNameInput: document.getElementById('projectNameInput'),
    colorOptions: document.getElementById('colorOptions'),
    closeProjectModal: document.getElementById('closeProjectModal'),
    cancelProject: document.getElementById('cancelProject'),
    confirmProject: document.getElementById('confirmProject')
};

// Initialize app
function init() {
    // Set initial theme
    document.documentElement.setAttribute('data-theme', state.theme);

    // Event listeners - Tab navigation
    elements.tabBar.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => switchView(tab.dataset.view));
    });

    // Theme toggles
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.themeToggleFocus.addEventListener('click', toggleTheme);
    elements.themeToggleAccount.addEventListener('click', toggleTheme);
    
    // Todo actions
    elements.addBtn.addEventListener('click', addTodo);
    elements.todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });
    
    // Focus view actions
    elements.backBtn.addEventListener('click', backToList);
    elements.startBtn.addEventListener('click', startTimer);
    elements.pauseBtn.addEventListener('click', pauseTimer);
    elements.resetBtn.addEventListener('click', resetTimer);
    elements.completeBtn.addEventListener('click', completeTodo);
    
    // Project modal
    elements.addProjectBtn.addEventListener('click', openProjectModal);
    elements.closeProjectModal.addEventListener('click', closeProjectModal);
    elements.cancelProject.addEventListener('click', closeProjectModal);
    elements.confirmProject.addEventListener('click', createProject);
    elements.projectModal.querySelector('.modal-overlay').addEventListener('click', closeProjectModal);
    
    // Color picker
    elements.colorOptions.querySelectorAll('.color-option').forEach(btn => {
        btn.addEventListener('click', () => {
            elements.colorOptions.querySelectorAll('.color-option').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.selectedProjectColor = btn.dataset.color;
        });
    });
    
    // Period tabs
    document.querySelectorAll('.period-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.period-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            state.currentPeriod = tab.dataset.period;
            updateStats();
        });
    });

    // Initial renders
    renderProjectSelect();
    renderTodos();
    renderProjects();
    renderRecords();
    updateStats();
}

// View management
function switchView(viewId) {
    // Update tabs
    elements.tabBar.querySelectorAll('.tab-item').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.view === viewId);
    });
    
    // Update views
    elements.listView.classList.toggle('hidden', viewId !== 'listView');
    elements.accountView.classList.toggle('hidden', viewId !== 'accountView');
    
    // Show/hide tab bar based on view
    elements.tabBar.classList.remove('hidden');
    
    // Update stats when switching to account view
    if (viewId === 'accountView') {
        updateStats();
        renderProjects();
        renderRecords();
    }
}

// Theme management
function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
}

// Project management
function openProjectModal() {
    elements.projectModal.classList.remove('hidden');
    elements.projectNameInput.value = '';
    elements.projectNameInput.focus();
}

function closeProjectModal() {
    elements.projectModal.classList.add('hidden');
}

function createProject() {
    const name = elements.projectNameInput.value.trim();
    if (!name) return;
    
    const project = {
        id: Date.now(),
        name: name,
        color: state.selectedProjectColor,
        createdAt: new Date().toISOString()
    };
    
    state.projects.push(project);
    saveProjects();
    renderProjects();
    renderProjectSelect();
    closeProjectModal();
}

function deleteProject(id) {
    if (!confirm('确定要删除这个项目吗？相关任务不会被删除。')) return;
    
    state.projects = state.projects.filter(p => p.id !== id);
    saveProjects();
    renderProjects();
    renderProjectSelect();
}

function saveProjects() {
    localStorage.setItem('projects', JSON.stringify(state.projects));
}

function renderProjectSelect() {
    const select = elements.projectSelect;
    select.innerHTML = '<option value="">选择项目</option>';
    state.projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        select.appendChild(option);
    });
}

function renderProjects() {
    if (state.projects.length === 0) {
        elements.emptyProjects.classList.remove('hidden');
        elements.projectsList.innerHTML = '';
        return;
    }
    
    elements.emptyProjects.classList.add('hidden');
    
    elements.projectsList.innerHTML = state.projects.map(project => {
        const projectTime = getProjectTotalTime(project.id);
        const taskCount = getProjectTaskCount(project.id);
        return `
            <div class="project-item">
                <div class="project-color" style="background: ${project.color}"></div>
                <div class="project-info">
                    <div class="project-name">${escapeHtml(project.name)}</div>
                    <div class="project-stats">${taskCount} 个任务</div>
                </div>
                <div class="project-time">${formatTimeShort(projectTime)}</div>
                <button class="project-delete" onclick="deleteProject(${project.id})">
                    <span class="delete-icon"></span>
                </button>
            </div>
        `;
    }).join('');
}

function getProjectTotalTime(projectId) {
    return state.completedRecords
        .filter(r => r.projectId === projectId)
        .reduce((sum, r) => sum + (r.totalTime || 0), 0);
}

function getProjectTaskCount(projectId) {
    return state.completedRecords.filter(r => r.projectId === projectId).length;
}

// Todo management
function addTodo() {
    const text = elements.todoInput.value.trim();
    if (!text) return;

    const projectId = elements.projectSelect.value ? parseInt(elements.projectSelect.value) : null;
    
    const todo = {
        id: Date.now() + Math.random(),
        name: text,
        projectId: projectId,
        createdAt: new Date().toISOString(),
        totalTime: 0,
        sessions: 0
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
    
    // Get project info
    const project = state.projects.find(p => p.id === todo.projectId);
    
    // Update ticket info
    elements.ticketNumber.textContent = formatTicketNumber(id);
    elements.ticketTaskName.textContent = todo.name;
    elements.ticketDate.textContent = formatDate(new Date());
    elements.ticketBranch.textContent = project ? project.name : '时间管理中心';
    
    // Load saved time
    state.timerSeconds = todo.totalTime || 0;
    updateTimerDisplay();
    updateTimerProgress();
    
    // Hide tab bar, switch to focus view
    elements.tabBar.classList.add('hidden');
    elements.listView.classList.add('hidden');
    elements.accountView.classList.add('hidden');
    elements.focusView.classList.remove('hidden');
}

function backToList() {
    if (state.timerRunning) {
        pauseTimer();
    }
    
    elements.completionSection.classList.add('hidden');
    elements.focusView.classList.add('hidden');
    elements.listView.classList.remove('hidden');
    elements.tabBar.classList.remove('hidden');
    
    state.currentTodoId = null;
}

function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(state.todos));
}

function renderTodos() {
    const count = state.todos.length;
    elements.todoCount.textContent = `${count} 个任务`;
    
    if (count === 0) {
        elements.emptyState.classList.add('visible');
        elements.todoList.innerHTML = '';
        return;
    }

    elements.emptyState.classList.remove('visible');
    
    elements.todoList.innerHTML = state.todos.map(todo => {
        const project = state.projects.find(p => p.id === todo.projectId);
        const projectBadge = project ? 
            `<span class="record-project"><span class="record-project-dot" style="background:${project.color}"></span>${escapeHtml(project.name)}</span>` : '';
        
        return `
            <div class="todo-item">
                <div class="todo-ticket-icon">
                    <span>🎫</span>
                </div>
                <div class="todo-content">
                    <div class="todo-name">${escapeHtml(todo.name)}</div>
                    <div class="todo-meta">
                        ${projectBadge}
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
        `;
    }).join('');
}

// Timer management
function startTimer() {
    if (state.timerRunning) return;
    
    state.timerRunning = true;
    elements.startBtn.classList.add('hidden');
    elements.pauseBtn.classList.remove('hidden');
    elements.completionSection.classList.add('hidden');
    
    // Increment session count
    const todo = state.todos.find(t => t.id === state.currentTodoId);
    if (todo) {
        todo.sessions = (todo.sessions || 0) + 1;
        saveTodos();
    }
    
    state.timerInterval = setInterval(() => {
        state.timerSeconds++;
        updateTimerDisplay();
        updateTimerProgress();
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
    elements.completionSection.classList.remove('hidden');
}

function resetTimer() {
    if (!confirm('确定要重置计时器吗？')) return;
    
    if (state.timerRunning) pauseTimer();
    
    state.timerSeconds = 0;
    updateTimerDisplay();
    updateTimerProgress();
    elements.completionSection.classList.remove('hidden');
}

function completeTodo() {
    if (state.currentTodoId === null) return;
    
    const todo = state.todos.find(t => t.id === state.currentTodoId);
    if (!todo) return;
    
    if (!confirm(`确定要完成任务"${todo.name}"吗？`)) return;
    
    if (state.timerRunning) {
        state.timerRunning = false;
        if (state.timerInterval) {
            clearInterval(state.timerInterval);
            state.timerInterval = null;
        }
        saveCurrentTodoTime();
    }
    
    // Create completed record
    const record = {
        id: Date.now(),
        name: todo.name,
        projectId: todo.projectId,
        totalTime: todo.totalTime || state.timerSeconds,
        sessions: todo.sessions || 1,
        completedAt: new Date().toISOString()
    };
    
    state.completedRecords.unshift(record);
    saveRecords();
    
    // Remove todo
    state.todos = state.todos.filter(t => t.id !== state.currentTodoId);
    saveTodos();
    
    // Return to list
    elements.focusView.classList.add('hidden');
    elements.listView.classList.remove('hidden');
    elements.tabBar.classList.remove('hidden');
    
    state.currentTodoId = null;
    state.timerSeconds = 0;
    elements.completionSection.classList.add('hidden');
    
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

function saveRecords() {
    localStorage.setItem('completedRecords', JSON.stringify(state.completedRecords));
}

function updateTimerDisplay() {
    const hours = Math.floor(state.timerSeconds / 3600);
    const minutes = Math.floor((state.timerSeconds % 3600) / 60);
    const seconds = state.timerSeconds % 60;
    
    if (hours > 0) {
        elements.timerDisplay.textContent = `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
    } else {
        elements.timerDisplay.textContent = `${padZero(minutes)}:${padZero(seconds)}`;
    }
}

function updateTimerProgress() {
    const cycleSeconds = 60 * 60;
    const progress = (state.timerSeconds % cycleSeconds) / cycleSeconds;
    const circumference = 2 * Math.PI * 90;
    const offset = circumference * (1 - progress);
    
    if (elements.timerProgress) {
        elements.timerProgress.style.strokeDashoffset = offset;
    }
}

// Stats management
function updateStats() {
    // Total balance
    const totalTime = state.completedRecords.reduce((sum, r) => sum + (r.totalTime || 0), 0);
    elements.totalBalance.textContent = formatTimeLong(totalTime);
    elements.completedCount.textContent = `已完成 ${state.completedRecords.length} 项任务`;
    
    // Period stats
    const periodRecords = getPeriodRecords(state.currentPeriod);
    const periodTime = periodRecords.reduce((sum, r) => sum + (r.totalTime || 0), 0);
    const periodTasks = periodRecords.length;
    const periodSessions = periodRecords.reduce((sum, r) => sum + (r.sessions || 1), 0);
    const avgTime = periodTasks > 0 ? Math.round(periodTime / periodTasks) : 0;
    
    elements.periodTime.textContent = formatTimeShort(periodTime);
    elements.periodTasks.textContent = periodTasks;
    elements.periodAvg.textContent = formatTimeShort(avgTime);
    elements.periodSessions.textContent = periodSessions;
}

function getPeriodRecords(period) {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return state.completedRecords.filter(record => {
        const completedAt = new Date(record.completedAt);
        switch(period) {
            case 'today':
                return completedAt >= startOfDay;
            case 'week':
                return completedAt >= startOfWeek;
            case 'month':
                return completedAt >= startOfMonth;
            default:
                return true;
        }
    });
}

function renderRecords() {
    const recentRecords = state.completedRecords.slice(0, 10);
    
    if (recentRecords.length === 0) {
        elements.emptyRecords.classList.remove('hidden');
        elements.recordsList.innerHTML = '';
        return;
    }
    
    elements.emptyRecords.classList.add('hidden');
    
    elements.recordsList.innerHTML = recentRecords.map(record => {
        const project = state.projects.find(p => p.id === record.projectId);
        const projectBadge = project ? 
            `<span class="record-project"><span class="record-project-dot" style="background:${project.color}"></span>${escapeHtml(project.name)}</span>` : '';
        
        return `
            <div class="record-item">
                <div class="record-icon">✓</div>
                <div class="record-info">
                    <div class="record-name">${escapeHtml(record.name)}</div>
                    <div class="record-meta">
                        ${projectBadge}
                        <span>${formatRecordDate(record.completedAt)}</span>
                    </div>
                </div>
                <div class="record-time">+${formatTimeShort(record.totalTime || 0)}</div>
            </div>
        `;
    }).join('');
}

// Utility functions
function formatTicketNumber(id) {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const idInt = Math.floor(id);
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

function formatRecordDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatTimeLong(seconds) {
    if (seconds === 0) return '0小时0分';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    return `${hours}小时${minutes}分`;
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

// Global functions
window.startFocus = startFocus;
window.deleteTodo = deleteTodo;
window.deleteProject = deleteProject;

// Cleanup
window.addEventListener('beforeunload', () => {
    if (state.timerRunning) {
        saveCurrentTodoTime();
    }
});

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

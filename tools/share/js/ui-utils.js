// UI Utilities - Helper functions for UI interactions

export function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, duration);
}

export function showLoading(message = '加载中...') {
    const loading = document.getElementById('loading');
    if (!loading) return;
    
    const text = loading.querySelector('p');
    if (text) text.textContent = message;
    
    loading.classList.add('active');
}

export function hideLoading() {
    const loading = document.getElementById('loading');
    if (!loading) return;
    
    loading.classList.remove('active');
}

export function confirm(message) {
    return window.confirm(message);
}

export function alert(message) {
    return window.alert(message);
}

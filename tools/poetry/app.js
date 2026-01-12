// State management
const state = {
    apiKey: localStorage.getItem('openai_api_key') || '',
    proxyUrl: localStorage.getItem('openai_proxy_url') || '',
    currentDescription: '',
    usedPoems: new Set(),
    theme: localStorage.getItem('theme') || 'light'
};

// DOM elements
const elements = {
    themeToggle: document.getElementById('themeToggle'),
    settingsBtn: document.getElementById('settingsBtn'),
    settingsModal: document.getElementById('settingsModal'),
    closeModal: document.getElementById('closeModal'),
    apiKeyInput: document.getElementById('apiKey'),
    proxyUrlInput: document.getElementById('proxyUrl'),
    saveSettings: document.getElementById('saveSettings'),
    descriptionInput: document.getElementById('descriptionInput'),
    searchBtn: document.getElementById('searchBtn'),
    poemResult: document.getElementById('poemResult'),
    poetResult: document.getElementById('poetResult'),
    refreshBtn: document.getElementById('refreshBtn')
};

// Initialize app
function init() {
    // Set initial theme
    document.documentElement.setAttribute('data-theme', state.theme);
    updateThemeIcon();

    // Load saved settings
    elements.apiKeyInput.value = state.apiKey;
    elements.proxyUrlInput.value = state.proxyUrl;

    // Event listeners
    elements.themeToggle.addEventListener('click', toggleTheme);
    elements.settingsBtn.addEventListener('click', openSettings);
    elements.closeModal.addEventListener('click', closeSettings);
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            closeSettings();
        }
    });
    elements.saveSettings.addEventListener('click', saveSettings);
    elements.searchBtn.addEventListener('click', handleSearch);
    elements.descriptionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSearch();
        }
    });
    elements.refreshBtn.addEventListener('click', handleRefresh);

    // Show settings if no API key is set
    if (!state.apiKey) {
        openSettings();
    }
}

// Theme management
function toggleTheme() {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', state.theme);
    localStorage.setItem('theme', state.theme);
    updateThemeIcon();
}

function updateThemeIcon() {
    elements.themeToggle.textContent = state.theme === 'light' ? '🌙' : '☀️';
    elements.themeToggle.setAttribute('aria-label', state.theme === 'light' ? '切换到深色模式' : '切换到浅色模式');
}

// Settings management
function openSettings() {
    elements.settingsModal.classList.add('active');
}

function closeSettings() {
    elements.settingsModal.classList.remove('active');
}

function saveSettings() {
    state.apiKey = elements.apiKeyInput.value.trim();
    state.proxyUrl = elements.proxyUrlInput.value.trim();
    
    localStorage.setItem('openai_api_key', state.apiKey);
    localStorage.setItem('openai_proxy_url', state.proxyUrl);
    
    closeSettings();
    
    // If there's a description, try to get poems again
    if (state.currentDescription) {
        getPoem(state.currentDescription);
    }
}

// Search handling
function handleSearch() {
    const description = elements.descriptionInput.value.trim();
    
    // Fade out previous result
    elements.poemResult.classList.remove('visible');
    elements.poetResult.classList.remove('visible');
    elements.refreshBtn.classList.remove('visible');
    
    if (description && description !== state.currentDescription) {
        state.currentDescription = description;
        state.usedPoems.clear();
        getPoem(description);
    } else if (description) {
        getPoem(description);
    }
}

// Refresh button handler
function handleRefresh() {
    if (state.currentDescription) {
        elements.poemResult.classList.remove('visible');
        elements.poetResult.classList.remove('visible');
        getPoem(state.currentDescription);
    }
}

// Helper function to remove quotes
function removeQuotes(text) {
    return text.replace(/^["「『]|["」』]$/g, '');
}

// API call to OpenAI
async function getPoem(description) {
    if (!state.apiKey) {
        showError('请在设置中配置 OpenAI API key');
        return;
    }

    const baseUrl = state.proxyUrl || 'https://api.openai.com/v1';
    const endpoint = `${baseUrl}/chat/completions`;

    // Build the prompt to avoid repetition
    let prompt = `根据以下描述，找出一句最合适的中国古典诗词（只需要一句诗词，不是整首诗）。请只返回诗词本身和作者名字，格式为：诗词内容\\n作者名字（如果不知道作者就写"佚名"）。不要返回任何其他内容。

描述：${description}`;
    
    if (state.usedPoems.size > 0) {
        const usedList = Array.from(state.usedPoems).join('、');
        prompt += `\n\n请不要推荐以下已推荐过的诗词：${usedList}`;
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: '你是一个精通中国古典诗词的助手。你需要根据用户的描述，找出最合适的一句诗词。返回格式为：诗词内容\\n作者名字。如果不知道作者，就写"佚名"。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 100
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch((parseError) => {
                console.error('Failed to parse error response:', parseError);
                return {};
            });
            throw new Error(errorData.error?.message || `API error: ${response.status}`);
        }

        const data = await response.json();
        const result = data.choices[0]?.message?.content?.trim();

        if (result) {
            const lines = result.split('\n').filter(line => line.trim());
            let poem = '';
            let poet = '佚名';
            
            if (lines.length >= 2) {
                poem = lines[0].trim();
                poet = lines[1].trim();
            } else if (lines.length === 1) {
                poem = lines[0].trim();
            }
            
            // Remove quotes if present
            poem = removeQuotes(poem);
            poet = removeQuotes(poet);
            
            state.usedPoems.add(poem);
            displayPoem(poem, poet);
        } else {
            showError('未获得诗词推荐');
        }
    } catch (error) {
        console.error('Error fetching poem:', error);
        showError(error.message || '获取诗词失败');
    }
}

// Display poem with typing animation
function displayPoem(poem, poet) {
    elements.poemResult.textContent = '';
    elements.poetResult.textContent = '';
    elements.poemResult.classList.remove('visible');
    elements.poetResult.classList.remove('visible');
    elements.poemResult.classList.add('typing');
    
    let index = 0;
    const typingSpeed = 100; // ms per character

    function typeCharacter() {
        if (index < poem.length) {
            elements.poemResult.textContent += poem[index];
            index++;
            setTimeout(typeCharacter, typingSpeed);
        } else {
            elements.poemResult.classList.remove('typing');
            elements.poemResult.classList.add('visible');
            // Show poet after poem is fully typed
            setTimeout(() => {
                elements.poetResult.textContent = `—— ${poet}`;
                elements.poetResult.classList.add('visible');
                elements.refreshBtn.classList.add('visible');
            }, 300);
        }
    }

    // Small delay before starting typing
    setTimeout(() => {
        elements.poemResult.classList.add('visible');
        typeCharacter();
    }, 200);
}

// Error display
function showError(message) {
    elements.poemResult.textContent = '⚠️';
    elements.poetResult.textContent = '';
    elements.poemResult.classList.add('visible');
    elements.poetResult.classList.remove('visible');
    elements.refreshBtn.classList.remove('visible');
    console.error(message);
    
    // Show alert with more details
    if (message.includes('API key') || message.includes('401')) {
        setTimeout(() => {
            if (confirm('API key 配置有误，是否打开设置？')) {
                openSettings();
            }
        }, 100);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

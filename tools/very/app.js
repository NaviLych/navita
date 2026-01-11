// State management
const state = {
    apiKey: localStorage.getItem('openai_api_key') || '',
    proxyUrl: localStorage.getItem('openai_proxy_url') || '',
    currentAdjective: '',
    usedSuggestions: new Set(),
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
    adjectiveInput: document.getElementById('adjectiveInput'),
    result: document.getElementById('result'),
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
    elements.adjectiveInput.addEventListener('input', handleAdjectiveInput);
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
    elements.themeToggle.setAttribute('aria-label', state.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode');
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
    
    // If there's an adjective, try to get suggestions again
    if (state.currentAdjective) {
        getSuggestion(state.currentAdjective);
    }
}

// Input handling
function handleAdjectiveInput(e) {
    const adjective = e.target.value.trim();
    
    // Fade out previous result
    elements.result.classList.remove('visible');
    elements.refreshBtn.classList.remove('visible');
    
    if (adjective && adjective !== state.currentAdjective) {
        state.currentAdjective = adjective;
        state.usedSuggestions.clear();
        
        // Wait a bit before making API call (debounce)
        clearTimeout(handleAdjectiveInput.timeout);
        handleAdjectiveInput.timeout = setTimeout(() => {
            getSuggestion(adjective);
        }, 500);
    }
}

// Refresh button handler
function handleRefresh() {
    if (state.currentAdjective) {
        elements.result.classList.remove('visible');
        getSuggestion(state.currentAdjective);
    }
}

// API call to OpenAI
async function getSuggestion(adjective) {
    if (!state.apiKey) {
        showError('Please set your OpenAI API key in settings');
        return;
    }

    const baseUrl = state.proxyUrl || 'https://api.openai.com/v1';
    const endpoint = `${baseUrl}/chat/completions`;

    // Build the prompt to avoid repetition
    let prompt = `Find a single, powerful alternative word for "very ${adjective}". Return only one word, nothing else.`;
    
    if (state.usedSuggestions.size > 0) {
        const usedWords = Array.from(state.usedSuggestions).join(', ');
        prompt += ` Do not suggest: ${usedWords}.`;
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
                        content: 'You are a helpful assistant that suggests powerful single-word alternatives to "very + adjective" combinations. Always respond with exactly one word, nothing else.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.8,
                max_tokens: 10
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
        const suggestion = data.choices[0]?.message?.content?.trim();

        if (suggestion) {
            state.usedSuggestions.add(suggestion.toLowerCase());
            displaySuggestion(suggestion);
        } else {
            showError('No suggestion received');
        }
    } catch (error) {
        console.error('Error fetching suggestion:', error);
        showError(error.message || 'Failed to fetch suggestion');
    }
}

// Display suggestion with typing animation
function displaySuggestion(word) {
    elements.result.textContent = '';
    elements.result.classList.remove('visible');
    elements.result.classList.add('typing');
    
    let index = 0;
    const typingSpeed = 100; // ms per character
    let timeoutId = null;

    function typeCharacter() {
        if (index < word.length) {
            elements.result.textContent += word[index];
            index++;
            timeoutId = setTimeout(typeCharacter, typingSpeed);
        } else {
            elements.result.classList.remove('typing');
            elements.result.classList.add('visible');
            elements.refreshBtn.classList.add('visible');
        }
    }

    // Small delay before starting typing
    setTimeout(() => {
        elements.result.classList.add('visible');
        typeCharacter();
    }, 200);
    
    // Cleanup function to prevent memory leaks
    return () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    };
}

// Error display
function showError(message) {
    elements.result.textContent = '⚠️';
    elements.result.classList.add('visible');
    elements.refreshBtn.classList.remove('visible');
    console.error(message);
    
    // Show alert with more details
    if (message.includes('API key') || message.includes('401')) {
        setTimeout(() => {
            if (confirm('API key issue. Would you like to open settings?')) {
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

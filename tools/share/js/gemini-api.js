// Gemini API Integration - AI-powered card style optimization
export class GeminiAPI {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
    }
    
    async generateCardStyle(cardData) {
        if (!this.apiKey) {
            throw new Error('Gemini API Key 未设置');
        }
        
        const prompt = this.buildStylePrompt(cardData);
        
        try {
            const response = await fetch(`${this.endpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.9,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 2048,
                    }
                })
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            const content = data.candidates[0].content.parts[0].text;
            
            // Parse the JSON response from Gemini
            return this.parseStyleResponse(content);
        } catch (error) {
            console.error('Gemini API error:', error);
            throw error;
        }
    }
    
    buildStylePrompt(cardData) {
        const type = cardData.type;
        let contextInfo = '';
        
        switch (type) {
            case 'music':
                contextInfo = `歌曲名称: ${cardData.songName}
歌手: ${cardData.artist}
歌词片段: ${cardData.lyrics || '无'}`;
                break;
            case 'podcast':
                contextInfo = `节目名称: ${cardData.episodeName}
播客名称: ${cardData.podcastName}
简介: ${cardData.summary || '无'}`;
                break;
            case 'article':
                contextInfo = `文章标题: ${cardData.title}
作者: ${cardData.author}
摘要: ${cardData.summary || '无'}`;
                break;
            case 'text':
                contextInfo = `文本内容: ${cardData.textContent}`;
                break;
        }
        
        return `你是一位专业的UI/UX设计师，擅长创作美观、现代的分享卡片设计。

请为以下${this.getTypeLabel(type)}卡片设计一个精美的样式方案：

${contextInfo}

请根据内容的情感、氛围和主题，生成一套完整的视觉设计方案，包括：
1. 主题色彩方案（渐变背景、文字颜色、强调色）
2. 布局建议（元素排布、间距、对齐方式）
3. 视觉效果（阴影、圆角、透明度、装饰元素）
4. 字体样式（大小、粗细、字间距）

要求：
- 设计要现代、简洁、有品味
- 配色要协调、舒适，符合内容氛围
- 注意信息层级，突出重点内容
- 适合在社交媒体分享
- 卡片尺寸为 390px × 520px

请以JSON格式返回设计方案，格式如下：
{
  "background": "CSS渐变或纯色背景",
  "primaryColor": "主要文字颜色",
  "secondaryColor": "次要文字颜色",
  "accentColor": "强调色",
  "cardStyle": {
    "borderRadius": "圆角大小",
    "boxShadow": "阴影效果",
    "padding": "内边距"
  },
  "titleStyle": {
    "fontSize": "字体大小",
    "fontWeight": "字重",
    "lineHeight": "行高",
    "marginBottom": "下边距"
  },
  "subtitleStyle": {
    "fontSize": "字体大小",
    "opacity": "透明度",
    "marginBottom": "下边距"
  },
  "contentStyle": {
    "fontSize": "字体大小",
    "lineHeight": "行高",
    "opacity": "透明度"
  },
  "decorations": [
    {
      "type": "描述装饰类型",
      "style": "CSS样式对象"
    }
  ]
}

只返回JSON，不要添加任何其他文字说明。`;
    }
    
    getTypeLabel(type) {
        const labels = {
            music: '音乐',
            podcast: '播客',
            article: '文章',
            text: '文字'
        };
        return labels[type] || '分享';
    }
    
    parseStyleResponse(content) {
        try {
            // Remove markdown code blocks if present
            let jsonStr = content.trim();
            if (jsonStr.startsWith('```json')) {
                jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
            } else if (jsonStr.startsWith('```')) {
                jsonStr = jsonStr.replace(/```\n?/g, '').replace(/```\n?$/g, '');
            }
            
            const style = JSON.parse(jsonStr);
            return style;
        } catch (error) {
            console.error('Failed to parse style response:', error);
            console.log('Raw response:', content);
            throw new Error('无法解析AI生成的样式方案');
        }
    }
    
    // Apply the generated style to a card element
    applyStyleToCard(cardElement, styleConfig) {
        if (!cardElement || !styleConfig) return;
        
        // Apply background
        if (styleConfig.background) {
            cardElement.style.background = styleConfig.background;
        }
        
        // Apply card-level styles
        if (styleConfig.cardStyle) {
            Object.entries(styleConfig.cardStyle).forEach(([key, value]) => {
                cardElement.style[key] = value;
            });
        }
        
        // Apply text colors
        if (styleConfig.primaryColor) {
            const titles = cardElement.querySelectorAll('.card-title, .card-episode');
            titles.forEach(el => el.style.color = styleConfig.primaryColor);
        }
        
        if (styleConfig.secondaryColor) {
            const subtitles = cardElement.querySelectorAll('.card-artist, .card-source, .card-podcast-name');
            subtitles.forEach(el => el.style.color = styleConfig.secondaryColor);
        }
        
        // Apply title styles
        if (styleConfig.titleStyle) {
            const titles = cardElement.querySelectorAll('.card-title, .card-episode');
            titles.forEach(el => {
                Object.entries(styleConfig.titleStyle).forEach(([key, value]) => {
                    el.style[key] = value;
                });
            });
        }
        
        // Apply subtitle styles
        if (styleConfig.subtitleStyle) {
            const subtitles = cardElement.querySelectorAll('.card-artist, .card-source, .card-podcast-name');
            subtitles.forEach(el => {
                Object.entries(styleConfig.subtitleStyle).forEach(([key, value]) => {
                    el.style[key] = value;
                });
            });
        }
        
        // Apply content styles
        if (styleConfig.contentStyle) {
            const contents = cardElement.querySelectorAll('.card-lyrics, .card-summary, .card-quote, .card-text-content');
            contents.forEach(el => {
                Object.entries(styleConfig.contentStyle).forEach(([key, value]) => {
                    el.style[key] = value;
                });
            });
        }
        
        // Add decorative elements if specified
        if (styleConfig.decorations && styleConfig.decorations.length > 0) {
            styleConfig.decorations.forEach(decoration => {
                const decorEl = document.createElement('div');
                decorEl.className = 'ai-decoration';
                if (decoration.style) {
                    Object.entries(decoration.style).forEach(([key, value]) => {
                        decorEl.style[key] = value;
                    });
                }
                cardElement.appendChild(decorEl);
            });
        }
    }
}

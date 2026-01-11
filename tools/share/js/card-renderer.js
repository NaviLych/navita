// Card Renderer - Renders card HTML based on type and theme
export class CardRenderer {
    render(cardData, theme) {
        const type = cardData.type;
        
        switch (type) {
            case 'music':
                return this.renderMusicCard(cardData, theme);
            case 'podcast':
                return this.renderPodcastCard(cardData, theme);
            case 'article':
                return this.renderArticleCard(cardData, theme);
            case 'text':
                return this.renderTextCard(cardData, theme);
            default:
                return '';
        }
    }
    
    renderMusicCard(data, theme) {
        const coverHtml = data.coverUrl 
            ? `<img src="${this.escapeHtml(data.coverUrl)}" alt="Cover" class="card-cover">`
            : `<div class="card-cover" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; font-size: 4rem;">🎵</div>`;
        
        const lyricsHtml = data.lyrics 
            ? `<div class="card-lyrics">${this.escapeHtml(data.lyrics)}</div>`
            : '';
        
        return `
            <div class="card-player card-music">
                <div class="card-cover-wrapper">
                    ${coverHtml}
                </div>
                <div class="card-info">
                    <div class="card-title">${this.escapeHtml(data.songName)}</div>
                    <div class="card-artist">${this.escapeHtml(data.artist)}</div>
                    ${lyricsHtml}
                </div>
            </div>
        `;
    }
    
    renderPodcastCard(data, theme) {
        const coverHtml = data.coverUrl 
            ? `<img src="${this.escapeHtml(data.coverUrl)}" alt="Cover" class="card-cover">`
            : `<div class="card-cover" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); display: flex; align-items: center; justify-content: center; font-size: 4rem;">🎙️</div>`;
        
        const summaryHtml = data.summary 
            ? `<div class="card-summary">${this.escapeHtml(data.summary)}</div>`
            : '';
        
        return `
            <div class="card-player card-podcast">
                <div class="card-cover-wrapper">
                    ${coverHtml}
                </div>
                <div class="card-info">
                    <div class="card-episode">${this.escapeHtml(data.episodeName)}</div>
                    <div class="card-podcast-name">${this.escapeHtml(data.podcastName)}</div>
                    ${summaryHtml}
                </div>
            </div>
        `;
    }
    
    renderArticleCard(data, theme) {
        const summaryHtml = data.summary 
            ? `<div class="card-summary">${this.escapeHtml(data.summary)}</div>`
            : '';
        
        const quoteHtml = data.quote 
            ? `<div class="card-quote">"${this.escapeHtml(data.quote)}"</div>`
            : '';
        
        return `
            <div class="card-article">
                <div class="card-title">${this.escapeHtml(data.title)}</div>
                <div class="card-source">作者：${this.escapeHtml(data.author)}</div>
                ${summaryHtml}
                ${quoteHtml}
            </div>
        `;
    }
    
    renderTextCard(data, theme) {
        let content = data.textContent;
        
        // Apply highlights if any - work with original text, then escape
        if (data.highlights && data.highlights.length > 0) {
            // Sort highlights by position (reverse order to maintain indices)
            const sortedHighlights = [...data.highlights].sort((a, b) => b.start - a.start);
            
            sortedHighlights.forEach(highlight => {
                const before = content.substring(0, highlight.start);
                const highlighted = content.substring(highlight.start, highlight.end);
                const after = content.substring(highlight.end);
                
                // Use a placeholder that won't be escaped
                content = before + 
                         `<<<HIGHLIGHT_START>>>${highlighted}<<<HIGHLIGHT_END>>>` + 
                         after;
            });
        }
        
        // Now escape the entire content
        content = this.escapeHtml(content);
        
        // Replace placeholders with actual HTML tags
        content = content.replace(/&lt;&lt;&lt;HIGHLIGHT_START&gt;&gt;&gt;/g, '<span class="highlight">');
        content = content.replace(/&lt;&lt;&lt;HIGHLIGHT_END&gt;&gt;&gt;/g, '</span>');
        
        // Convert line breaks to <br> tags
        content = content.replace(/\n/g, '<br>');
        
        return `
            <div class="card-text-content">
                ${content}
            </div>
        `;
    }
    
    escapeHtml(text) {
        if (!text) return '';
        
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Get theme-specific styles
    getThemeStyles(theme) {
        const themes = {
            modern: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#ffffff',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            },
            classic: {
                background: '#f8f9fa',
                color: '#212529',
                fontFamily: 'Georgia, serif'
            },
            minimal: {
                background: '#ffffff',
                color: '#2d3748',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            },
            vibrant: {
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: '#ffffff',
                fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
            },
            elegant: {
                background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
                color: '#e5e5e5',
                fontFamily: 'Georgia, serif'
            },
            retro: {
                background: '#fef3c7',
                color: '#92400e',
                fontFamily: 'Courier New, monospace'
            }
        };
        
        return themes[theme] || themes.modern;
    }
}

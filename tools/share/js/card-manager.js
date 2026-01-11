// Card Manager - Handles different card types and form generation
export class CardManager {
    constructor() {
        this.type = null;
    }
    
    setType(type) {
        this.type = type;
    }
    
    getFormHTML() {
        switch (this.type) {
            case 'music':
                return this.getMusicForm();
            case 'podcast':
                return this.getPodcastForm();
            case 'article':
                return this.getArticleForm();
            case 'text':
                return this.getTextForm();
            default:
                return '';
        }
    }
    
    getMusicForm() {
        return `
            <div class="form-group">
                <label for="url">歌曲链接（可选）</label>
                <input type="url" id="url" placeholder="https://...">
                <button type="button" class="btn-fetch">自动获取信息</button>
            </div>
            
            <div class="form-group">
                <label for="songName">歌名 *</label>
                <input type="text" id="songName" placeholder="请输入歌名" required>
            </div>
            
            <div class="form-group">
                <label for="artist">歌手 *</label>
                <input type="text" id="artist" placeholder="请输入歌手名" required>
            </div>
            
            <div class="form-group">
                <label for="coverUrl">封面图片链接</label>
                <input type="url" id="coverUrl" placeholder="https://...">
                <small>如果自动获取失败，请手动输入</small>
            </div>
            
            <div class="form-group">
                <label for="lyrics">喜爱歌词（可选）</label>
                <textarea id="lyrics" placeholder="输入你喜欢的歌词片段..."></textarea>
            </div>
        `;
    }
    
    getPodcastForm() {
        return `
            <div class="form-group">
                <label for="url">播客链接（可选）</label>
                <input type="url" id="url" placeholder="https://...">
                <button type="button" class="btn-fetch">自动获取信息</button>
            </div>
            
            <div class="form-group">
                <label for="episodeName">节目名 *</label>
                <input type="text" id="episodeName" placeholder="请输入节目名" required>
            </div>
            
            <div class="form-group">
                <label for="podcastName">播客名 *</label>
                <input type="text" id="podcastName" placeholder="请输入播客名" required>
            </div>
            
            <div class="form-group">
                <label for="coverUrl">封面图片链接</label>
                <input type="url" id="coverUrl" placeholder="https://...">
                <small>如果自动获取失败，请手动输入</small>
            </div>
            
            <div class="form-group">
                <label for="summary">节目简介（可选）</label>
                <textarea id="summary" placeholder="输入节目简介..."></textarea>
            </div>
        `;
    }
    
    getArticleForm() {
        return `
            <div class="form-group">
                <label for="url">文章链接</label>
                <input type="url" id="url" placeholder="https://...">
            </div>
            
            <div class="form-group">
                <label for="title">文章标题 *</label>
                <input type="text" id="title" placeholder="请输入文章标题" required>
            </div>
            
            <div class="form-group">
                <label for="author">作者/来源 *</label>
                <input type="text" id="author" placeholder="请输入作者或来源" required>
            </div>
            
            <div class="form-group">
                <label class="checkbox-label">
                    <input type="checkbox" id="generateSummary">
                    <span>自动生成150字摘要（需要 OpenAI API）</span>
                </label>
            </div>
            
            <div class="form-group" id="summaryField">
                <label for="summary">摘要（可选）</label>
                <textarea id="summary" placeholder="手动输入摘要..."></textarea>
            </div>
            
            <div class="form-group">
                <label for="quote">金句摘抄（可选）</label>
                <textarea id="quote" placeholder="输入你喜欢的句子..."></textarea>
            </div>
        `;
    }
    
    getTextForm() {
        return `
            <div class="form-group">
                <label for="textContent">文字内容 *</label>
                <textarea id="textContent" placeholder="输入你想分享的文字..." 
                          style="min-height: 200px;" required></textarea>
                <small>选中文字后可以高亮显示</small>
            </div>
        `;
    }
}

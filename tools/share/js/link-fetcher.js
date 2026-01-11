// Link Fetcher - Fetches metadata from URLs
export class LinkFetcher {
    async fetchMetadata(url, type) {
        try {
            // In a real implementation, you would call a backend service or use CORS proxy
            // For this demo, we'll try to fetch basic meta tags
            
            // Use a CORS proxy for demo purposes
            const proxyUrl = 'https://api.allorigins.win/get?url=';
            const response = await fetch(proxyUrl + encodeURIComponent(url));
            
            if (!response.ok) {
                throw new Error('Failed to fetch');
            }
            
            const data = await response.json();
            const htmlContent = data.contents;
            
            // Parse HTML to extract metadata
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');
            
            const metadata = {};
            
            // Extract Open Graph tags
            metadata.title = this.getMetaContent(doc, 'og:title') || 
                           this.getMetaContent(doc, 'twitter:title') ||
                           doc.querySelector('title')?.textContent;
            
            metadata.description = this.getMetaContent(doc, 'og:description') || 
                                 this.getMetaContent(doc, 'twitter:description') ||
                                 this.getMetaContent(doc, 'description');
            
            metadata.cover = this.getMetaContent(doc, 'og:image') || 
                           this.getMetaContent(doc, 'twitter:image');
            
            // Type-specific extraction
            if (type === 'music') {
                metadata.artist = this.getMetaContent(doc, 'music:musician') ||
                                this.getMetaContent(doc, 'og:music:artist');
            } else if (type === 'article') {
                metadata.author = this.getMetaContent(doc, 'article:author') ||
                                this.getMetaContent(doc, 'author');
            }
            
            return metadata;
        } catch (error) {
            console.error('Fetch metadata error:', error);
            return null;
        }
    }
    
    getMetaContent(doc, property) {
        // Try different meta tag selectors
        let meta = doc.querySelector(`meta[property="${property}"]`) ||
                  doc.querySelector(`meta[name="${property}"]`);
        return meta?.getAttribute('content');
    }
    
    // Fallback method using simple heuristics
    async fetchBasicInfo(url) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            
            // Extract title from HTML
            const titleMatch = html.match(/<title>(.*?)<\/title>/i);
            const title = titleMatch ? titleMatch[1] : '';
            
            // Try to find images
            const imgMatch = html.match(/<img[^>]+src="([^">]+)"/i);
            const cover = imgMatch ? imgMatch[1] : '';
            
            return { title, cover };
        } catch (error) {
            console.error('Basic fetch error:', error);
            return null;
        }
    }
}

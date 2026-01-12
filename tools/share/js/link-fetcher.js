// Link Fetcher - Fetches metadata from URLs
export class LinkFetcher {
    async fetchMetadata(url, type) {
        try {
            // NOTE: This implementation uses a third-party CORS proxy service.
            // In a production environment, consider:
            // 1. Using a self-hosted proxy for better privacy
            // 2. Implementing server-side metadata fetching
            // 3. Warning users about privacy implications
            // The current approach is for demonstration purposes only.
            
            // Handle short URLs - try to follow redirects first
            let finalUrl = url;
            if (url.includes('163cn.tv') || url.includes('y.music.163.com')) {
                try {
                    finalUrl = await this.resolveShortUrl(url);
                } catch (error) {
                    console.log('Could not resolve short URL, using original:', error);
                }
            }
            
            // Try multiple CORS proxies in sequence
            const proxies = [
                'https://api.allorigins.win/get?url=',
                'https://corsproxy.io/?',
                'https://api.codetabs.com/v1/proxy?quest='
            ];
            
            let metadata = null;
            let lastError = null;
            
            for (const proxyUrl of proxies) {
                try {
                    const response = await fetch(proxyUrl + encodeURIComponent(finalUrl), {
                        signal: AbortSignal.timeout(15000) // 15 second timeout
                    });
                    
                    if (!response.ok) {
                        lastError = new Error(`HTTP ${response.status}`);
                        continue;
                    }
                    
                    let htmlContent;
                    const contentType = response.headers.get('content-type');
                    
                    // Handle different proxy response formats
                    if (proxyUrl.includes('allorigins')) {
                        const data = await response.json();
                        htmlContent = data.contents;
                    } else {
                        htmlContent = await response.text();
                    }
                    
                    // Parse HTML to extract metadata
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(htmlContent, 'text/html');
                    
                    metadata = this.extractMetadata(doc, type);
                    
                    // If we got some useful metadata, return it
                    if (metadata && (metadata.title || metadata.cover)) {
                        return metadata;
                    }
                    
                } catch (error) {
                    console.log(`Proxy ${proxyUrl} failed:`, error);
                    lastError = error;
                    continue;
                }
            }
            
            // If all proxies failed, throw the last error
            if (lastError) {
                throw lastError;
            }
            
            return metadata;
        } catch (error) {
            console.error('Fetch metadata error:', error);
            return null;
        }
    }
    
    async resolveShortUrl(shortUrl) {
        // Try to resolve short URL via CORS proxy
        try {
            const proxyUrl = 'https://api.allorigins.win/get?url=';
            const response = await fetch(proxyUrl + encodeURIComponent(shortUrl), {
                signal: AbortSignal.timeout(10000),
                redirect: 'follow'
            });
            
            if (response.ok) {
                const data = await response.json();
                // Try to extract the actual URL from the response
                const parser = new DOMParser();
                const doc = parser.parseFromString(data.contents, 'text/html');
                
                // Look for redirect meta tags or canonical URLs
                const canonicalLink = doc.querySelector('link[rel="canonical"]');
                if (canonicalLink) {
                    return canonicalLink.href;
                }
                
                // Check for meta refresh redirect
                const metaRefresh = doc.querySelector('meta[http-equiv="refresh"]');
                if (metaRefresh) {
                    const content = metaRefresh.getAttribute('content');
                    const match = content.match(/url=(.+)/i);
                    if (match) {
                        return match[1];
                    }
                }
            }
        } catch (error) {
            console.log('Failed to resolve short URL:', error);
        }
        
        return shortUrl; // Return original if resolution fails
    }
    
    extractMetadata(doc, type) {
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
                            this.getMetaContent(doc, 'og:music:artist') ||
                            this.getMetaContent(doc, 'music:artist');
            
            // For NetEase Music, try to extract from structured data
            const ldJson = doc.querySelector('script[type="application/ld+json"]');
            if (ldJson) {
                try {
                    const data = JSON.parse(ldJson.textContent);
                    if (data['@type'] === 'MusicRecording') {
                        metadata.title = metadata.title || data.name;
                        metadata.artist = metadata.artist || data.byArtist?.name;
                        metadata.cover = metadata.cover || data.image;
                    }
                } catch (e) {
                    console.log('Failed to parse JSON-LD:', e);
                }
            }
        } else if (type === 'article') {
            metadata.author = this.getMetaContent(doc, 'article:author') ||
                            this.getMetaContent(doc, 'author');
        }
        
        return metadata;
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

// RSS Parser module
// Handles fetching and parsing RSS/Atom feeds

class RSSParser {
    constructor() {
        this.corsProxy = 'https://api.allorigins.win/raw?url=';
    }

    // Fetch and parse RSS feed
    async fetchFeed(url) {
        try {
            // Try direct fetch first
            let response;
            try {
                response = await fetch(url);
                if (!response.ok) throw new Error('Direct fetch failed');
            } catch (e) {
                // If direct fetch fails, use CORS proxy
                response = await fetch(this.corsProxy + encodeURIComponent(url));
                if (!response.ok) throw new Error('Proxy fetch failed');
            }

            const text = await response.text();
            const parser = new DOMParser();
            const xml = parser.parseFromString(text, 'text/xml');

            // Check for parsing errors
            const parserError = xml.querySelector('parsererror');
            if (parserError) {
                throw new Error('XML parsing failed');
            }

            // Determine feed type (RSS or Atom)
            const isAtom = xml.querySelector('feed');
            const feedData = isAtom ? this.parseAtomFeed(xml) : this.parseRSSFeed(xml);

            return feedData;
        } catch (error) {
            console.error('Error fetching feed:', error);
            throw error;
        }
    }

    // Parse RSS 2.0 feed
    parseRSSFeed(xml) {
        const channel = xml.querySelector('channel');
        if (!channel) {
            throw new Error('Invalid RSS feed: no channel element');
        }

        const feed = {
            title: this.getTextContent(channel, 'title') || 'Untitled Feed',
            description: this.getTextContent(channel, 'description') || '',
            link: this.getTextContent(channel, 'link') || '',
            items: []
        };

        const items = xml.querySelectorAll('item');
        items.forEach(item => {
            feed.items.push({
                title: this.getTextContent(item, 'title') || 'Untitled',
                link: this.getTextContent(item, 'link') || '',
                description: this.getTextContent(item, 'description') || '',
                content: this.getTextContent(item, 'content:encoded') || this.getTextContent(item, 'description') || '',
                pubDate: this.parseDate(this.getTextContent(item, 'pubDate')),
                guid: this.getTextContent(item, 'guid') || this.getTextContent(item, 'link') || '',
                author: this.getTextContent(item, 'author') || this.getTextContent(item, 'dc:creator') || ''
            });
        });

        return feed;
    }

    // Parse Atom feed
    parseAtomFeed(xml) {
        const feedElement = xml.querySelector('feed');
        if (!feedElement) {
            throw new Error('Invalid Atom feed: no feed element');
        }

        const feed = {
            title: this.getTextContent(feedElement, 'title') || 'Untitled Feed',
            description: this.getTextContent(feedElement, 'subtitle') || '',
            link: this.getAtomLink(feedElement) || '',
            items: []
        };

        const entries = xml.querySelectorAll('entry');
        entries.forEach(entry => {
            feed.items.push({
                title: this.getTextContent(entry, 'title') || 'Untitled',
                link: this.getAtomLink(entry) || '',
                description: this.getTextContent(entry, 'summary') || '',
                content: this.getTextContent(entry, 'content') || this.getTextContent(entry, 'summary') || '',
                pubDate: this.parseDate(this.getTextContent(entry, 'published') || this.getTextContent(entry, 'updated')),
                guid: this.getTextContent(entry, 'id') || this.getAtomLink(entry) || '',
                author: this.getAtomAuthor(entry)
            });
        });

        return feed;
    }

    // Helper: Get text content from XML element
    getTextContent(element, selector) {
        const el = element.querySelector(selector);
        return el ? el.textContent.trim() : '';
    }

    // Helper: Get Atom link
    getAtomLink(element) {
        const link = element.querySelector('link[rel="alternate"]') || element.querySelector('link');
        return link ? link.getAttribute('href') : '';
    }

    // Helper: Get Atom author
    getAtomAuthor(element) {
        const author = element.querySelector('author name');
        return author ? author.textContent.trim() : '';
    }

    // Helper: Parse date string
    parseDate(dateString) {
        if (!dateString) return Date.now();
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? Date.now() : date.getTime();
    }

    // Extract plain text from HTML content
    extractPlainText(html, maxLength = 200) {
        const div = document.createElement('div');
        div.innerHTML = html;
        let text = div.textContent || div.innerText || '';
        text = text.trim();
        if (text.length > maxLength) {
            text = text.substring(0, maxLength) + '...';
        }
        return text;
    }

    // Sanitize HTML content
    sanitizeHTML(html) {
        const div = document.createElement('div');
        div.innerHTML = html;

        // Remove script tags
        const scripts = div.querySelectorAll('script');
        scripts.forEach(script => script.remove());

        // Remove event handlers
        const allElements = div.querySelectorAll('*');
        allElements.forEach(el => {
            const attributes = el.attributes;
            for (let i = attributes.length - 1; i >= 0; i--) {
                const attr = attributes[i];
                if (attr.name.startsWith('on')) {
                    el.removeAttribute(attr.name);
                }
            }
        });

        return div.innerHTML;
    }
}

// Create singleton instance
const rssParser = new RSSParser();

export default rssParser;

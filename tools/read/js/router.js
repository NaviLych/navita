// Client-side router
import UI from './ui.js';

class Router {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.init();
    }

    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    register(path, handler) {
        this.routes.set(path, handler);
    }

    navigate(path) {
        window.location.hash = path;
    }

    handleRoute() {
        const hash = window.location.hash.slice(1) || '/home';
        const [path, queryString] = hash.split('?');
        const params = this.parseQuery(queryString);
        
        // Update active nav item
        this.updateActiveNav(path);
        
        // Find and execute route handler
        const handler = this.routes.get(path);
        if (handler) {
            this.currentRoute = path;
            handler(params);
        } else {
            // 404 - redirect to home
            this.navigate('/home');
        }
    }

    parseQuery(queryString) {
        if (!queryString) return {};
        const params = {};
        queryString.split('&').forEach(pair => {
            const [key, value] = pair.split('=');
            params[decodeURIComponent(key)] = decodeURIComponent(value);
        });
        return params;
    }

    updateActiveNav(path) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            const route = item.getAttribute('data-route');
            if (path === `/${route}` || (path === '/' && route === 'home')) {
                item.classList.add('active');
            }
        });
    }

    getCurrentRoute() {
        return this.currentRoute;
    }
}

const router = new Router();
export default router;
export { router };

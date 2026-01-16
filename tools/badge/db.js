// IndexedDB wrapper for badge storage
class BadgeDB {
    constructor() {
        this.dbName = 'BadgeGeneratorDB';
        this.version = 1;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create badges store
                if (!db.objectStoreNames.contains('badges')) {
                    const badgeStore = db.createObjectStore('badges', { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    badgeStore.createIndex('timestamp', 'timestamp', { unique: false });
                    badgeStore.createIndex('title', 'title', { unique: false });
                }

                // Create settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };
        });
    }

    async saveBadge(badgeData) {
        const transaction = this.db.transaction(['badges'], 'readwrite');
        const store = transaction.objectStore('badges');
        
        const badge = {
            ...badgeData,
            timestamp: Date.now()
        };

        return new Promise((resolve, reject) => {
            const request = store.add(badge);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async updateBadge(id, badgeData) {
        const transaction = this.db.transaction(['badges'], 'readwrite');
        const store = transaction.objectStore('badges');
        
        const badge = {
            ...badgeData,
            id,
            timestamp: Date.now()
        };

        return new Promise((resolve, reject) => {
            const request = store.put(badge);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAllBadges() {
        const transaction = this.db.transaction(['badges'], 'readonly');
        const store = transaction.objectStore('badges');

        return new Promise((resolve, reject) => {
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getBadge(id) {
        const transaction = this.db.transaction(['badges'], 'readonly');
        const store = transaction.objectStore('badges');

        return new Promise((resolve, reject) => {
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async deleteBadge(id) {
        const transaction = this.db.transaction(['badges'], 'readwrite');
        const store = transaction.objectStore('badges');

        return new Promise((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async saveSetting(key, value) {
        const transaction = this.db.transaction(['settings'], 'readwrite');
        const store = transaction.objectStore('settings');

        return new Promise((resolve, reject) => {
            const request = store.put({ key, value });
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    async getSetting(key) {
        const transaction = this.db.transaction(['settings'], 'readonly');
        const store = transaction.objectStore('settings');

        return new Promise((resolve, reject) => {
            const request = store.get(key);
            request.onsuccess = () => resolve(request.result?.value);
            request.onerror = () => reject(request.error);
        });
    }

    async clearAllBadges() {
        const transaction = this.db.transaction(['badges'], 'readwrite');
        const store = transaction.objectStore('badges');

        return new Promise((resolve, reject) => {
            const request = store.clear();
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Export singleton instance
const badgeDB = new BadgeDB();

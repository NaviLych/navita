// Settings Manager - Handles localStorage for settings
export class SettingsManager {
    constructor() {
        this.storageKey = 'shareCardSettings';
        this.settings = this.load();
    }
    
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : {};
        } catch (error) {
            console.error('Failed to load settings:', error);
            return {};
        }
    }
    
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.error('Failed to save settings:', error);
            return false;
        }
    }
    
    get(key) {
        return this.settings[key];
    }
    
    set(key, value) {
        this.settings[key] = value;
        return this.save();
    }
    
    clear() {
        this.settings = {};
        return this.save();
    }
}

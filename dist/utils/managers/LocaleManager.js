import path from 'node:path';
import fs from 'node:fs/promises';
export default class LocaleManager {
    client;
    locales = new Map();
    defaultLocale = 'en-US';
    constructor(client) {
        this.client = client;
    }
    /**
     * Initializes the locale manager by loading all locale files
     */
    async init() {
        try {
            const localesDir = path.resolve('./dist/locales');
            try {
                await fs.access(localesDir);
                const files = await fs.readdir(localesDir);
                for (const file of files) {
                    if (!file.endsWith('.json'))
                        continue;
                    const localeName = path.basename(file, '.json');
                    const content = await fs.readFile(path.join(localesDir, file), 'utf-8');
                    try {
                        const strings = JSON.parse(content);
                        this.locales.set(localeName, strings);
                    }
                    catch (error) {
                        this.client.logger.error(`Failed to parse locale file ${file}`, error);
                    }
                }
                this.client.logger.ready(`Loaded ${this.locales.size} locale(s)`);
            }
            catch (err) {
                this.client.logger.warn('No locale files found');
            }
        }
        catch (error) {
            this.client.logger.error('Failed to initialize LocaleManager', error);
        }
    }
    /**
     * Simple translation function to get a string by key path
     */
    translate(key, locale = this.defaultLocale, replacements) {
        // Get the locale data or fall back to default
        const data = this.locales.get(locale) || this.locales.get(this.defaultLocale);
        if (!data)
            return key;
        // Navigate the nested object using the key path
        const parts = key.split('.');
        let current = data;
        for (const part of parts) {
            if (!current[part])
                return key;
            current = current[part];
        }
        // Return the key if it's not a string
        if (typeof current !== 'string')
            return key;
        // Handle replacements
        if (replacements) {
            let result = current;
            for (const [placeholder, value] of Object.entries(replacements)) {
                result = result.replace(new RegExp(`{{${placeholder}}}`, 'g'), value);
            }
            return result;
        }
        return current;
    }
    /**
     * Gets all available locales
     * @returns Array of available locale codes
     */
    getAvailableLocales() {
        return Array.from(this.locales.keys());
    }
    /**
     * Checks if the locale system is enabled and working
     * @returns True if the locale system is enabled and has at least one locale loaded
     */
    isEnabled() {
        return this.client.config.withLocales === true && this.locales.size > 0;
    }
}

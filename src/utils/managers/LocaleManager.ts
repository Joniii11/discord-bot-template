import path from 'node:path';
import fs from 'node:fs/promises';
import DiscordBot from '../structures/DiscordBot.js';

export interface LocaleStrings {
    [key: string]: string | LocaleStrings;
}

export default class LocaleManager {
    private client: DiscordBot;
    private locales: Map<string, LocaleStrings> = new Map();
    private defaultLocale: string = 'en-US';
    
    constructor(client: DiscordBot) {
        this.client = client;
    }
    
    /**
     * Initializes the locale manager by loading all locale files
     */
    public async init(): Promise<void> {
        try {
            const localesDir = path.resolve('./dist/locales');
            
            try {
                await fs.access(localesDir);
                const files = await fs.readdir(localesDir);
                
                for (const file of files) {
                    if (!file.endsWith('.json')) continue;
                    
                    const localeName = path.basename(file, '.json');
                    const content = await fs.readFile(path.join(localesDir, file), 'utf-8');
                    try {
                        const strings = JSON.parse(content);
                        this.locales.set(localeName, strings);
                    } catch (error) {
                        this.client.logger.error(`Failed to parse locale file ${file}`, error);
                    }
                }
                
                this.client.logger.ready(`Loaded ${this.locales.size} locale(s)`);
            } catch (err) {
                this.client.logger.warn('No locale files found');
            }
        } catch (error) {
            this.client.logger.error('Failed to initialize LocaleManager', error);
        }
    }
    
    /**
     * Simple translation function to get a string by key path
     */
    public translate(key: string, locale: string = this.defaultLocale, replacements?: Record<string, string>): string {
        // Get the locale data or fall back to default
        const data = this.locales.get(locale) || this.locales.get(this.defaultLocale);
        if (!data) return key;
        
        // Navigate the nested object using the key path
        const parts = key.split('.');
        let current: any = data;
        
        for (const part of parts) {
            if (!current[part]) return key;
            current = current[part];
        }
        
        // Return the key if it's not a string
        if (typeof current !== 'string') return key;
        
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
    public getAvailableLocales(): string[] {
        return Array.from(this.locales.keys());
    }
}

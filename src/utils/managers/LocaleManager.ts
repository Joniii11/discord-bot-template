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
            const files = await fs.readdir(localesDir);
            
            for (const file of files) {
                if (!file.endsWith('.json')) continue;
                
                const localeName = path.basename(file, '.json');
                const content = await fs.readFile(path.join(localesDir, file), 'utf-8');
                try {
                    const strings = JSON.parse(content);
                    this.locales.set(localeName, strings);
                    this.client.logger.debug(`Loaded locale: ${localeName}`);
                } catch (error) {
                    this.client.logger.error(`Failed to parse locale file ${file}`, error);
                }
            }
            
            this.client.logger.ready(`Initialized LocaleManager with ${this.locales.size} locales`);
        } catch (error) {
            this.client.logger.error('Failed to initialize LocaleManager', error);
            // Create default locale directory and file if it doesn't exist
            try {
                const localesDir = path.resolve('./dist/locales');
                await fs.mkdir(localesDir, { recursive: true });
                
                const defaultLocale: LocaleStrings = {
                    common: {
                        yes: "Yes",
                        no: "No",
                        error: "Error",
                        success: "Success"
                    }
                };
                
                await fs.writeFile(
                    path.join(localesDir, 'en-US.json'), 
                    JSON.stringify(defaultLocale, null, 2)
                );
                
                this.locales.set('en-US', defaultLocale);
                this.client.logger.info('Created default locale file at ./dist/locales/en-US.json');
            } catch (err) {
                this.client.logger.error('Failed to create default locale file', err);
            }
        }
    }
    
    /**
     * Gets a localized string by key path
     * @param key - Dot-separated path to the string (e.g. "common.error.unknown")
     * @param locale - The locale to use, defaults to the default locale
     * @param replacements - Key-value pairs to replace in the string
     * @returns The localized string
     */
    public t(key: string, locale: string = this.defaultLocale, replacements?: Record<string, string>): string {
        const localeData = this.locales.get(locale) || this.locales.get(this.defaultLocale);
        if (!localeData) {
            return key;
        }
        
        // Navigate the nested object using the key path
        const keyParts = key.split('.');
        let current: any = localeData;
        
        for (const part of keyParts) {
            if (current[part] === undefined) {
                // If key doesn't exist, return the key itself
                return key;
            }
            current = current[part];
        }
        
        if (typeof current !== 'string') {
            return key;
        }
        
        // Replace placeholders if provided
        if (replacements) {
            let result = current;
            for (const [placeholder, value] of Object.entries(replacements)) {
                result = result.replace(new RegExp(`\\{\\{${placeholder}\\}\\}`, 'g'), value);
            }
            return result;
        }
        
        return current;
    }
    
    /**
     * Sets the default locale
     * @param locale - The locale code to use as default
     * @returns True if the locale exists and was set as default, false otherwise
     */
    public setDefaultLocale(locale: string): boolean {
        if (this.locales.has(locale)) {
            this.defaultLocale = locale;
            return true;
        }
        return false;
    }
    
    /**
     * Gets the default locale
     * @returns The default locale code
     */
    public getDefaultLocale(): string {
        return this.defaultLocale;
    }
    
    /**
     * Gets all available locales
     * @returns Array of available locale codes
     */
    public getAvailableLocales(): string[] {
        return Array.from(this.locales.keys());
    }
}

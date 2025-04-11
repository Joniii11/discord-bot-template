import CommandManager from "./CommandManager.js";
import ComponentManager from "./ComponentManager.js";
import CooldownManager from "./CooldownManager.js";
import EventManager from "./EventManager.js";
import InteractionManager from "./InteractionManager.js";
import LocaleManager from "./LocaleManager.js";
import MessageManager from "./MessageManager.js";
export default class Manager {
    client;
    // Managers
    eventManager;
    messageManager;
    interactionManager;
    commandManager;
    cooldownManager;
    componentManager;
    localeManager; // Make optional with ?
    constructor(client) {
        this.client = client;
        // Initialize Managers
        this.eventManager = new EventManager(this.client);
        this.messageManager = new MessageManager(this.client);
        this.interactionManager = new InteractionManager(this.client);
        this.commandManager = new CommandManager(this.client);
        this.cooldownManager = new CooldownManager(this.client);
        this.componentManager = new ComponentManager(this.client);
        // Only create LocaleManager if enabled in config
        if (client.config.withLocales) {
            this.localeManager = new LocaleManager(this.client);
        }
    }
    ;
    async init() {
        this.client.logger.debug("Initializing the Manager...");
        // Array of initialization promises
        const initPromises = [
            this.eventManager.init(),
            this.commandManager.init(),
            this.componentManager.init()
        ];
        // Conditionally add localeManager initialization
        if (this.client.config.withLocales && this.localeManager) {
            initPromises.push(this.localeManager.init());
            this.client.logger.debug("Localization is enabled, initializing LocaleManager");
        }
        else {
            this.client.logger.debug("Localization is disabled, skipping LocaleManager initialization");
        }
        await Promise.allSettled(initPromises)
            .catch((err) => this.client.logger.error("Error occured while initializing the Manager.", err));
        this.client.logger.ready("Initialized the Manager!");
    }
    ;
    async initOnClientReadyAndMaintenanceOff() {
        await Promise.allSettled([
            this.messageManager.init(),
            this.interactionManager.init()
        ]);
    }
    /**
     * Get a translation string - simple interface for all translations
     * @param options - Translation options with key, replacements and locale
     * @returns The translated string or the key itself if not found
     */
    t(options) {
        // If localization is disabled, just return the key
        if (!this.client.config.withLocales || !this.localeManager) {
            return options.key;
        }
        // Get the locale from params or default
        const usedLocale = options.locale || 'en-US';
        // Get translation and handle replacements
        return this.localeManager.translate(options.key, usedLocale, options.replacements);
    }
}
;

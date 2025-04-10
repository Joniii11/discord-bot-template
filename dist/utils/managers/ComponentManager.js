import { readdir } from "node:fs/promises";
import CooldownManager from "./CooldownManager.js";
export default class ComponentManager {
    client;
    exactComponents = new Map();
    patternComponents = new Map();
    cooldownManager;
    initialized = false;
    constructor(client) {
        this.client = client;
        this.cooldownManager = new CooldownManager(client);
        // Initialize pattern component maps for each type
        this.patternComponents.set("button", []);
        this.patternComponents.set("stringSelect", []);
        this.patternComponents.set("userSelect", []);
        this.patternComponents.set("roleSelect", []);
        this.patternComponents.set("channelSelect", []);
        this.patternComponents.set("mentionableSelect", []);
        this.patternComponents.set("modal", []);
    }
    async init() {
        await this._loadComponents();
        this.initialized = true;
        this.client.logger.ready("Initialized the ComponentManager.");
    }
    async _loadComponents() {
        try {
            const componentFolders = await readdir("./dist/components/");
            const loadComponentFolder = async (folder) => {
                const files = await readdir(`./dist/components/${folder}/`);
                const promises = [];
                for (const file of files) {
                    promises.push(this._loadComponentFile(folder, file));
                }
                await Promise.allSettled(promises);
            };
            const promises = [];
            for (const folder of componentFolders) {
                promises.push(loadComponentFolder(folder));
            }
            await Promise.allSettled(promises);
        }
        catch (error) {
            // If components directory doesn't exist yet, just log it
            this.client.logger.debug("Components directory not found, skipping component loading.");
        }
    }
    async _loadComponentFile(folder, file) {
        try {
            const component = await import(`../../components/${folder}/${file}`);
            if (!component.data) {
                return this.client.logger.warn(`Component file ${folder}/${file} is missing data.`);
            }
            const componentData = component.data;
            // Register the component
            if ("idPattern" in componentData) {
                this.registerPatternComponent(componentData);
            }
            else {
                this.registerComponent(componentData);
            }
            this.client.logger.debug(`Loaded component: ${componentData.id}`);
        }
        catch (error) {
            this.client.logger.error(`Failed to load component file ${folder}/${file}`, error);
        }
    }
    async handleInteraction(interaction) {
        if (interaction.isButton()) {
            return this._handleButtonInteraction(interaction);
        }
        else if (interaction.isStringSelectMenu()) {
            return this._handleSelectInteraction(interaction, "stringSelect");
        }
        else if (interaction.isUserSelectMenu()) {
            return this._handleSelectInteraction(interaction, "userSelect");
        }
        else if (interaction.isRoleSelectMenu()) {
            return this._handleSelectInteraction(interaction, "roleSelect");
        }
        else if (interaction.isChannelSelectMenu()) {
            return this._handleSelectInteraction(interaction, "channelSelect");
        }
        else if (interaction.isMentionableSelectMenu()) {
            return this._handleSelectInteraction(interaction, "mentionableSelect");
        }
        else if (interaction.isModalSubmit()) {
            return this._handleModalInteraction(interaction);
        }
    }
    async _handleButtonInteraction(interaction) {
        const { customId, user } = interaction;
        // Try exact match first
        const component = this.exactComponents.get(customId);
        if (component) {
            return this._executeComponent(component, interaction);
        }
        // Try pattern match
        const patterns = this.patternComponents.get("button") || [];
        for (const patternComponent of patterns) {
            if (patternComponent.idPattern.test(customId)) {
                return this._executeComponent(patternComponent, interaction);
            }
        }
        // No handler found
        this.client.logger.debug(`No handler found for button ID: ${customId}`);
    }
    async _handleSelectInteraction(interaction, type) {
        const { customId, user } = interaction;
        // Try exact match first
        const component = this.exactComponents.get(customId);
        if (component && component.type === type) {
            return this._executeComponent(component, interaction);
        }
        // Try pattern match
        const patterns = this.patternComponents.get(type) || [];
        for (const patternComponent of patterns) {
            if (patternComponent.idPattern.test(customId)) {
                return this._executeComponent(patternComponent, interaction);
            }
        }
        // No handler found
        this.client.logger.debug(`No handler found for select menu ID: ${customId}`);
    }
    async _handleModalInteraction(interaction) {
        const { customId, user } = interaction;
        // Try exact match first
        const component = this.exactComponents.get(customId);
        if (component) {
            return this._executeComponent(component, interaction);
        }
        // Try pattern match
        const patterns = this.patternComponents.get("modal") || [];
        for (const patternComponent of patterns) {
            if (patternComponent.idPattern.test(customId)) {
                return this._executeComponent(patternComponent, interaction);
            }
        }
        // No handler found
        this.client.logger.debug(`No handler found for modal ID: ${customId}`);
    }
    async _executeComponent(component, interaction) {
        // Handle cooldown if specified
        if (component.options?.cooldown && component.options.cooldown > 0) {
            const result = this.cooldownManager.applyCooldown(`component:${component.id}`, interaction.user.id, component.options.cooldown);
            if (result.isCooldowned) {
                return interaction.reply({
                    content: `You're on cooldown for ${result.remaining} more seconds.`,
                    ephemeral: true
                });
            }
        }
        try {
            // For pattern components, extract parameters from customId
            if ('idPattern' in component) {
                const matches = component.idPattern.exec(interaction.customId);
                // Extract all capturing groups as string array (skip the first full match)
                const params = matches ? matches.slice(1) : [];
                // Execute with extracted parameters
                await component.execute(this.client, interaction, params);
            }
            else {
                // Regular component without pattern
                await component.execute(this.client, interaction);
            }
        }
        catch (error) {
            this.client.logger.error(`Error executing component ${component.id}:`, error);
            // Reply with error if interaction hasn't been responded to
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "There was an error executing this component.",
                    ephemeral: true
                }).catch(() => { });
            }
        }
    }
    /**
     * Register a component with an exact ID match
     */
    registerComponent(component) {
        if (this.exactComponents.has(component.id)) {
            this.client.logger.warn(`Component with ID ${component.id} already exists. Overwriting.`);
        }
        this.exactComponents.set(component.id, component);
        return this;
    }
    /**
     * Register a component with a pattern-based ID match
     */
    registerPatternComponent(component) {
        const patternList = this.patternComponents.get(component.type);
        if (!patternList) {
            this.patternComponents.set(component.type, [component]);
        }
        else {
            patternList.push(component);
        }
        return this;
    }
    /**
     * Get a component by its exact ID
     */
    getComponent(id, type) {
        const component = this.exactComponents.get(id);
        if (!component)
            return undefined;
        if (type && component.type !== type)
            return undefined;
        // After type check, we can safely cast component to the expected type
        return component;
    }
}

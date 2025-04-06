import { CacheType, Interaction } from "discord.js";
import DiscordBot from "../structures/DiscordBot.js";
import CommandExecutor from "../structures/CommandExecutor.js";

export default class InteractionManager<T extends boolean = false> {
    private client: DiscordBot;
    private ready = false;

    public constructor(client: DiscordBot) {
        this.client = client;
    };

    public async init() {
        //? Initialize the Interaction Manager
        this.client.logger.ready("Initialized the Interaction Manager!");
        this.ready = true; 
    };

    public isReady(): this is InteractionManager<true> {
        return this.ready;
    };

    public async _eventRunner(client: DiscordBot, interaction: Interaction<CacheType>) {
        if (interaction.isChatInputCommand()) {
            const commandExecutor = new CommandExecutor({ client, interaction });
            await client.manager.commandManager.runCommand(commandExecutor);
        } else if (
            interaction.isButton() || 
            interaction.isStringSelectMenu() || 
            interaction.isUserSelectMenu() || 
            interaction.isRoleSelectMenu() || 
            interaction.isChannelSelectMenu() || 
            interaction.isMentionableSelectMenu() || 
            interaction.isModalSubmit()
        ) {
            // Handle component interactions
            await client.manager.componentManager.handleInteraction(interaction);
        }
    }
}
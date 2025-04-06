import { Message, OmitPartialGroupDMChannel } from "discord.js";
import DiscordBot from "../structures/DiscordBot.js";
import CommandExecutor from "../structures/CommandExecutor.js";

export default class MessageManager<T extends boolean = false> {
    private client: DiscordBot;
    private ready = false;

    public constructor(client: DiscordBot) {
        this.client = client;
    }

    public async init(): Promise<void> {
        //? Initialize the Message Manager
        this.client.logger.ready("Initialized the Message Manager!");
        this.ready = true;
    }

    // Change the getter to a method that returns a type predicate.
    public isReady(): this is MessageManager<true> {
        return this.ready;
    }

    public async _eventRunner(client: DiscordBot, message: OmitPartialGroupDMChannel<Message<boolean>>): Promise<void> {
        const commandExecutor = new CommandExecutor({ client, message });

        await this.client.manager.commandManager.runCommand(commandExecutor);        
    };
}
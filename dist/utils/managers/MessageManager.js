import CommandExecutor from "../structures/CommandExecutor.js";
export default class MessageManager {
    client;
    ready = false;
    constructor(client) {
        this.client = client;
    }
    ;
    async init() {
        this.ready = true;
        this.client.logger.ready("Initialized the Message Manager!");
    }
    ;
    isReady() {
        return this.ready;
    }
    ;
    async _eventRunner(client, message) {
        if (message.author.bot)
            return;
        // Get prefix from client config
        const prefix = client.config.prefix;
        // Early return if message doesn't start with prefix
        if (!message.content.startsWith(prefix)) {
            return;
        }
        // Log the raw message content for debugging
        client.logger.debug(`Processing message command: ${message.content}`);
        // Create command executor for the message
        const commandExecutor = new CommandExecutor({ message, client });
        // If the prefix is the only content (e.g., just "!" with no command)
        if (message.content.length <= prefix.length) {
            return;
        }
        // Execute the command
        await client.manager.commandManager.runCommand(commandExecutor);
    }
}

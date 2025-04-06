import CommandExecutor from "../structures/CommandExecutor.js";
export default class MessageManager {
    client;
    ready = false;
    constructor(client) {
        this.client = client;
    }
    async init() {
        //? Initialize the Message Manager
        this.client.logger.ready("Initialized the Message Manager!");
        this.ready = true;
    }
    // Change the getter to a method that returns a type predicate.
    isReady() {
        return this.ready;
    }
    async _eventRunner(client, message) {
        const commandExecutor = new CommandExecutor({ client, message });
        await this.client.manager.commandManager.runCommand(commandExecutor);
    }
    ;
}

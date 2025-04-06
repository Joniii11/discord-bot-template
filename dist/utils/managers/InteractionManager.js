import CommandExecutor from "../structures/CommandExecutor.js";
export default class InteractionManager {
    client;
    ready = false;
    constructor(client) {
        this.client = client;
    }
    ;
    async init() {
        //? Initialize the Interaction Manager
        this.client.logger.ready("Initialized the Interaction Manager!");
        this.ready = true;
    }
    ;
    isReady() {
        return this.ready;
    }
    ;
    async _eventRunner(client, interaction) {
        if (interaction.isChatInputCommand()) {
            const commandExecutor = new CommandExecutor({ client, interaction });
            await client.manager.commandManager.runCommand(commandExecutor);
        }
        ;
    }
}

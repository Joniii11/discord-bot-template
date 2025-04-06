export default class CommandExecutor {
    interaction;
    message;
    client;
    commandName = "";
    arguments;
    replied = false;
    constructor(options) {
        if ("interaction" in options) {
            this.interaction = options.interaction;
            this.message = undefined;
            this.commandName = options.interaction.commandName;
            this.replied = options.interaction.deferred;
        }
        else {
            this.message = options.message;
            this.interaction = undefined;
            const [cmdName, ...args] = options.message.content.slice(options.client.config.prefix.length).trim().split(/ +/);
            this.arguments = args ?? [];
            this.commandName = cmdName;
        }
        this.client = options.client;
    }
    /**
     * Type guard: returns true if interaction is defined.
     */
    isInteraction() {
        return this.interaction !== undefined;
    }
    /**
     * Type guard: returns true if message is defined
     * yeah it wokrs.
     */
    isMessage() {
        return this.message !== undefined;
    }
    /**
     * Type guard: returns true if both interaction and message are undefined.
     */
    isDefault() {
        return this.interaction === undefined && this.message === undefined;
    }
    get getAuthor() {
        if (this.isMessage()) {
            return this.message.author;
        }
        else if (this.isInteraction()) {
            return this.interaction.user;
        }
        throw new TypeError("Both message and interaction were not provided.");
    }
    async reply(options) {
        if (this.isInteraction()) {
            return this.interaction.reply(options);
        }
        else if (this.isMessage()) {
            return this.message.reply(options);
        }
        throw new Error("No valid target to reply.");
    }
    ;
    // Implementation signature
    async deferReply(options) {
        if (!this.isInteraction())
            return;
        const result = await this.interaction.deferReply(options);
        console.log(result);
        if (result)
            this.replied = true;
        return result;
    }
    async editReply(options) {
        if (this.isInteraction()) {
            this.replied ? await this.deferReply() : null;
            console.log((this.replied), "mauw");
            return this.interaction.editReply(options);
        }
        else if (this.isMessage()) {
            return this.message.reply(options);
        }
        throw new Error("CommandExecutor: Both is not defined.");
    }
}

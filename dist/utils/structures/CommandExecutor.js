export default class CommandExecutor {
    interaction;
    message;
    client;
    constructor(options) {
        if ("interaction" in options) {
            this.interaction = options.interaction;
            this.message = undefined;
        }
        else {
            this.message = options.message;
            this.interaction = undefined;
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
    async editReply(options) {
        if (this.isInteraction()) {
            return this.interaction.editReply(options);
        }
        else if (this.isMessage()) {
            return this.message.reply(options);
        }
        throw new Error("CommandExecutor: Both is not defined.");
    }
}

import { Message, } from "discord.js";
/**
 * CommandExecutor provides a unified interface for handling both message-based and
 * interaction-based commands. It abstracts away the differences between the two,
 * allowing command handlers to work with either input method.
 *
 * @template T - The execution mode, either 'interaction' or 'message'
 */
export default class CommandExecutor {
    /**
     * The interaction object if this executor was created from an interaction
     * @type {ChatInputCommandInteraction | undefined}
     */
    interaction;
    /**
     * The message object if this executor was created from a message
     * @type {Message | undefined}
     */
    message;
    /**
     * Reference to the Discord bot client
     * @type {DiscordBot}
     */
    client;
    /**
     * The name of the command being executed
     * @type {string}
     */
    commandName = "";
    /**
     * Command arguments when in message mode (space-separated parts after the command name)
     * @type {string[] | undefined}
     */
    arguments;
    /**
     * Whether the command has been replied to
     * @type {boolean}
     * @private
     */
    replied = false;
    /**
     * Creates a new CommandExecutor
     * @param {Object} options - The options for this executor
     * @param {ChatInputCommandInteraction} [options.interaction] - The interaction that triggered this command
     * @param {Message} [options.message] - The message that triggered this command
     * @param {DiscordBot} options.client - The Discord bot client
     */
    constructor(options) {
        if ("interaction" in options) {
            this.interaction = options.interaction;
            this.message = undefined;
            this.commandName = options.interaction.commandName;
            this.replied = options.interaction.deferred || options.interaction.replied;
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
     * Type guard: checks if this executor was created from an interaction
     * @returns {boolean} True if interaction is defined
     */
    isInteraction() {
        return this.interaction !== undefined;
    }
    /**
     * Type guard: checks if this executor was created from a message
     * @returns {boolean} True if message is defined
     */
    isMessage() {
        return this.message !== undefined;
    }
    /**
     * Type guard: checks if neither interaction nor message is defined
     * @returns {boolean} True if both interaction and message are undefined
     */
    isDefault() {
        return this.interaction === undefined && this.message === undefined;
    }
    /**
     * Gets the author/user who triggered this command
     * @returns {User} The user who initiated the command
     * @throws {TypeError} If neither message nor interaction is defined
     */
    get getAuthor() {
        if (this.isMessage()) {
            return this.message.author;
        }
        else if (this.isInteraction()) {
            return this.interaction.user;
        }
        throw new TypeError("Both message and interaction were not provided.");
    }
    /**
     * Replies to the command, handling both interaction and message modes
     * @param {string | MessagePayload | MessageReplyOptions | InteractionReplyOptions} options - Options for the reply
     * @returns {Promise<Message | InteractionResponse | InteractionCallbackResponse>} The response
     * @throws {Error} If no valid target to reply to
     */
    async reply(options) {
        if (this.isInteraction()) {
            this.replied = true;
            return this.interaction.reply(options);
        }
        else if (this.isMessage()) {
            return this.message.reply(options);
        }
        throw new Error("No valid target to reply.");
    }
    /**
     * Defers the reply to the command, handling both interaction and message modes
     * @param {InteractionDeferReplyOptions} [options] - Options for deferring
     * @returns {Promise<InteractionCallbackResponse | InteractionResponse | void>} The response or void
     */
    async deferReply(options) {
        if (this.isInteraction()) {
            const result = await this.interaction.deferReply(options);
            this.replied = true;
            return result;
        }
        // For message mode, this is a no-op
        return Promise.resolve();
    }
    /**
     * Edits the reply or specified message
     * @param {string | MessagePayload | InteractionEditReplyOptions | Message} optionsOrMessage - Options for editing or message to edit
     * @param {string | MessagePayload | MessageReplyOptions} [messageOptions] - Options when editing a specific message
     * @returns {Promise<Message>} The edited message
     * @throws {Error} If no valid target to edit
     */
    async editReply(optionsOrMessage, messageOptions) {
        if (this.isInteraction()) {
            if (!this.replied) {
                await this.deferReply();
            }
            return this.interaction.editReply(optionsOrMessage);
        }
        else if (this.isMessage()) {
            // If first argument is a Message object, edit it
            if (optionsOrMessage instanceof Message) {
                if (!messageOptions) {
                    throw new Error("Message options are required when editing a message");
                }
                return optionsOrMessage.edit(messageOptions);
            }
            // Otherwise, reply with a new message
            return this.message.reply(optionsOrMessage);
        }
        throw new Error("CommandExecutor: Both is not defined.");
    }
    /**
     * Deletes the message or reply, handling both modes
     * @returns {Promise<Message | void>} The deleted message or void
     * @throws {Error} If no valid target to delete
     */
    async delete() {
        if (this.isInteraction()) {
            return this.deleteReply();
        }
        else if (this.isMessage()) {
            return this.message.delete();
        }
        throw new Error("No valid target to delete.");
    }
    /**
     * Deletes a reply or message, handling both modes
     * @param {MessageResolvable | '@original'} [message='@original'] - The message to delete in interaction mode
     * @returns {Promise<void | Message>} Void or the deleted message
     * @throws {Error} If no valid target for deletion
     */
    async deleteReply(message) {
        if (this.isInteraction()) {
            return this.interaction.deleteReply(message);
        }
        else if (this.isMessage()) {
            return this.message.delete();
        }
        throw new Error("No valid target for delete operation.");
    }
    /**
     * Fetches a reply or returns the message, handling both modes
     * @param {MessageResolvable | '@original'} [message='@original'] - The message to fetch in interaction mode
     * @returns {Promise<Message>} The message
     * @throws {Error} If no valid target to fetch
     */
    async fetchReply(message) {
        if (this.isInteraction()) {
            return this.interaction.fetchReply(message);
        }
        else if (this.isMessage()) {
            return this.message;
        }
        throw new Error("No valid target for fetch operation.");
    }
    /**
     * Sends a follow-up message, handling both modes
     * @param {string | MessagePayload | InteractionReplyOptions | MessageReplyOptions} options - Content or options
     * @returns {Promise<Message>} The follow-up or reply message
     * @throws {Error} If no valid target for follow-up
     */
    async followUp(options) {
        if (this.isInteraction()) {
            return this.interaction.followUp(options);
        }
        else if (this.isMessage()) {
            return this.message.reply(options);
        }
        throw new Error("No valid target for follow-up message.");
    }
    /**
     * Adds a reaction to the message or reply, handling both modes
     * @param {EmojiIdentifierResolvable} emoji - The emoji to react with
     * @returns {Promise<MessageReaction>} The added reaction
     * @throws {Error} If no valid target for reaction
     */
    async react(emoji) {
        if (this.isMessage()) {
            return this.message.react(emoji);
        }
        else if (this.isInteraction()) {
            const reply = await this.fetchReply();
            return reply.react(emoji);
        }
        throw new Error("No valid target for reaction.");
    }
    /**
     * Pins the message or reply, handling both modes
     * @param {string} [reason] - Reason for pinning
     * @returns {Promise<Message>} The pinned message
     * @throws {Error} If no valid target for pin operation
     */
    async pin(reason) {
        if (this.isMessage()) {
            return this.message.pin(reason);
        }
        else if (this.isInteraction()) {
            const reply = await this.fetchReply();
            return reply.pin(reason);
        }
        throw new Error("No valid target for pin operation.");
    }
    /**
     * Unpins the message or reply, handling both modes
     * @param {string} [reason] - Reason for unpinning
     * @returns {Promise<Message>} The unpinned message
     * @throws {Error} If no valid target for unpin operation
     */
    async unpin(reason) {
        if (this.isMessage()) {
            return this.message.unpin(reason);
        }
        else if (this.isInteraction()) {
            const reply = await this.fetchReply();
            return reply.unpin(reason);
        }
        throw new Error("No valid target for unpin operation.");
    }
    /**
     * Shows a modal component to the user (interaction mode only)
     * @param {ModalBuilder | ModalComponentData | APIModalInteractionResponseCallbackData} modal - The modal to show
     * @param {ShowModalOptions} [options] - Options for showing the modal
     * @returns {Promise<InteractionCallbackResponse | undefined>} The interaction response
     * @throws {Error} If used in message mode
     */
    async showModal(modal, options) {
        if (this.isInteraction()) {
            this.replied = true;
            return this.interaction.showModal(modal, options);
        }
        throw new Error("ShowModal is only available for interactions.");
    }
    /**
     * Suppresses or unsuppresses embeds on the message or reply
     * @param {boolean} [suppress=true] - Whether to suppress embeds
     * @returns {Promise<Message>} The updated message
     * @throws {Error} If no valid target for the operation
     */
    async suppressEmbeds(suppress = true) {
        if (this.isMessage()) {
            return this.message.suppressEmbeds(suppress);
        }
        else if (this.isInteraction()) {
            const reply = await this.fetchReply();
            return reply.suppressEmbeds(suppress);
        }
        throw new Error("No valid target for suppress embeds operation.");
    }
    /**
     * Creates a new thread from the message or reply
     * @param {StartThreadOptions} options - Options for creating the thread
     * @returns {Promise<ThreadChannel>} The created thread
     * @throws {Error} If no valid target for starting a thread
     */
    async startThread(options) {
        if (this.isMessage()) {
            return this.message.startThread(options);
        }
        else if (this.isInteraction()) {
            const reply = await this.fetchReply();
            return reply.startThread(options);
        }
        throw new Error("No valid target for starting thread.");
    }
    /**
     * Crossposts the message or reply to announcement channels
     * @returns {Promise<Message>} The crossposted message
     * @throws {Error} If no valid target for crosspost or not in an announcement channel
     */
    async crosspost() {
        if (this.isMessage()) {
            return this.message.crosspost();
        }
        else if (this.isInteraction()) {
            const reply = await this.fetchReply();
            return reply.crosspost();
        }
        throw new Error("No valid target for crosspost operation.");
    }
    /**
     * Collects a message component interaction from the message or reply
     * @template T - The type of component to collect
     * @param {AwaitMessageCollectorOptionsParams<T>} [options] - Options for collecting
     * @returns {Promise<MappedInteractionTypes<boolean>[T]>} The collected interaction
     * @throws {Error} If no valid target for collecting components
     */
    async awaitMessageComponent(options) {
        if (this.isMessage()) {
            return this.message.awaitMessageComponent(options);
        }
        else if (this.isInteraction()) {
            const reply = await this.fetchReply();
            return reply.awaitMessageComponent(options);
        }
        throw new Error("No valid target for awaiting message component.");
    }
    /**
     * Collects reactions on the message or reply
     * @param {AwaitReactionsOptions} [options] - Options for collecting reactions
     * @returns {Promise<Collection<string, MessageReaction>>} Collection of collected reactions
     * @throws {Error} If no valid target for collecting reactions
     */
    async awaitReactions(options) {
        if (this.isMessage()) {
            return this.message.awaitReactions(options);
        }
        else if (this.isInteraction()) {
            const reply = await this.fetchReply();
            return reply.awaitReactions(options);
        }
        throw new Error("No valid target for awaiting reactions.");
    }
    /**
     * Creates a collector for reactions on the message or reply
     * @param {ReactionCollectorOptions} [options] - Options for the collector
     * @returns {Promise<ReactionCollector>} The reaction collector
     * @throws {Error} If no valid target for collecting reactions
     */
    async createReactionCollector(options) {
        if (this.isMessage()) {
            return this.message.createReactionCollector(options);
        }
        else if (this.isInteraction()) {
            const message = await this.fetchReply();
            return message.createReactionCollector(options);
        }
        throw new Error("No valid target for creating reaction collector.");
    }
    // AwaitModalSubmit - only for interactions
    /**
     * Collects a modal submit interaction
     * @param {Object} options - Options for collecting the modal submission
     * @param {CollectorFilter<[any]>} [options.filter] - Filter function for the modal
     * @param {number} options.time - Time in milliseconds to wait for submission
     * @returns {Promise<any>} The modal submit interaction
     * @throws {Error} If used in message mode
     */
    async awaitModalSubmit(options) {
        if (this.isInteraction()) {
            return this.interaction.awaitModalSubmit(options);
        }
        throw new Error("AwaitModalSubmit is only available for interactions.");
    }
    /**
     * Fetches the message or reply
     * @param {boolean} [force] - Whether to force fetch from the API in message mode
     * @returns {Promise<Message>} The fetched message
     * @throws {Error} If no valid target for fetch operation
     */
    async fetch(force) {
        if (this.isMessage()) {
            return this.message.fetch(force);
        }
        else if (this.isInteraction()) {
            return this.fetchReply();
        }
        throw new Error("No valid target for fetch operation.");
    }
    /**
     * Removes all attachments from the message or reply
     * @returns {Promise<Message>} The updated message
     * @throws {Error} If no valid target for removing attachments
     */
    async removeAttachments() {
        if (this.isMessage()) {
            return this.message.removeAttachments();
        }
        else if (this.isInteraction()) {
            const reply = await this.fetchReply();
            return reply.removeAttachments();
        }
        throw new Error("No valid target for removing attachments.");
    }
}

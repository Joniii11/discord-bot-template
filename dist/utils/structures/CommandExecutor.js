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
     * Parsed arguments as a named key-value object (for message commands)
     * @type {Record<string, any>}
     */
    parsedArgs = {};
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
            // Better handling of prefix extraction
            const prefixLength = options.client.config.prefix.length;
            const messageContent = options.message.content.slice(prefixLength).trim();
            // Check if there's actual content after the prefix
            if (messageContent.length === 0) {
                this.commandName = "";
                this.arguments = [];
            }
            else {
                const [cmdName, ...args] = messageContent.split(/ +/);
                this.commandName = cmdName;
                this.arguments = args ?? [];
                // Add debug log
                options.client.logger.debug(`Extracted command: ${cmdName}, Args: [${args.join(", ")}]`);
            }
        }
        this.client = options.client;
    }
    /**
     * Type guard: checks if this executor was created from an interaction
     * @returns {this is CommandExecutor<"interaction">} True if interaction is defined
     */
    isInteraction() {
        return this.interaction !== undefined;
    }
    /**
     * Type guard: checks if this executor was created from a message
     * @returns {this is CommandExecutor<"message">} True if message is defined
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
     * Gets the execution mode of this executor
     * @returns {"interaction" | "message" | "unknown"} The execution mode
     */
    getMode() {
        if (this.isInteraction())
            return "interaction";
        if (this.isMessage())
            return "message";
        return "unknown";
    }
    /**
     * Executes the appropriate callback based on the execution mode
     * @param options - Object containing callbacks for different modes
     * @returns The result of the executed callback
     */
    withMode({ interaction, message, fallback }) {
        if (this.isInteraction() && interaction) {
            return interaction(this);
        }
        else if (this.isMessage() && message) {
            return message(this);
        }
        else if (fallback) {
            return fallback();
        }
        throw new Error("No appropriate handler found for this CommandExecutor mode");
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
     * Gets a string option from command arguments
     * @param {string} name - The name of the option to get
     * @param {boolean} [required=false] - Whether the option is required
     * @returns {string | null} The value of the option, or null if not provided
     */
    getString(name, required) {
        if (this.isInteraction()) {
            return this.interaction.options.getString(name, required);
        }
        else if (this.isMessage()) {
            const value = this.parsedArgs[name];
            if (required && (value === undefined || value === null)) {
                throw new Error(`Required option '${name}' is missing`);
            }
            return (value !== undefined ? String(value) : null);
            ;
        }
        return (null);
        ;
    }
    /**
     * Gets a number option from command arguments
     * @param {string} name - The name of the option to get
     * @param {boolean} [required=false] - Whether the option is required
     * @returns {number | null} The value of the option, or null if not provided
     */
    getNumber(name, required) {
        if (this.isInteraction()) {
            return this.interaction.options.getNumber(name, required);
        }
        else if (this.isMessage()) {
            const value = this.parsedArgs[name];
            if (required && (value === undefined || value === null)) {
                throw new Error(`Required option '${name}' is missing`);
            }
            return (value !== undefined ? Number(value) : null);
        }
        return null;
    }
    /**
     * Gets an integer option from command arguments
     * @param {string} name - The name of the option to get
     * @param {boolean} [required=false] - Whether the option is required
     * @returns {number | null} The value of the option, or null if not provided
     */
    getInteger(name, required) {
        if (this.isInteraction()) {
            return this.interaction.options.getInteger(name, required);
        }
        else if (this.isMessage()) {
            const value = this.parsedArgs[name];
            if (required && (value === undefined || value === null)) {
                throw new Error(`Required option '${name}' is missing`);
            }
            return (value !== undefined ? Math.floor(Number(value)) : null);
        }
        return null;
    }
    /**
     * Gets a boolean option from command arguments
     * @param {string} name - The name of the option to get
     * @param {boolean} [required=false] - Whether the option is required
     * @returns {boolean | null} The value of the option, or null if not provided
     */
    getBoolean(name, required) {
        if (this.isInteraction()) {
            return this.interaction.options.getBoolean(name, required);
        }
        else if (this.isMessage()) {
            const value = this.parsedArgs[name];
            if (required && (value === undefined || value === null)) {
                throw new Error(`Required option '${name}' is missing`);
            }
            return (value !== undefined ? Boolean(value) : null);
        }
        return null;
    }
    /**
     * Gets a user option from command arguments
     * @param {string} name - The name of the option to get
     * @param {boolean} [required=false] - Whether the option is required
     * @returns {User | null} The user, or null if not provided
     */
    getUser(name, required) {
        if (this.isInteraction()) {
            return this.interaction.options.getUser(name, required);
        }
        else if (this.isMessage()) {
            const userId = this.parsedArgs[name];
            if (required && (userId === undefined || userId === null)) {
                throw new Error(`Required option '${name}' is missing`);
            }
            if (!userId)
                return null;
            const user = this.client.users.cache.get(userId);
            if (required && !user) {
                throw new Error(`Required user '${name}' was not found`);
            }
            return user;
        }
        return null;
    }
    /**
     * Gets a channel option from command arguments
     * @param {string} name - The name of the option to get
     * @param {boolean} [required=false] - Whether the option is required
     * @returns {Channel | null} The channel, or null if not provided
     */
    getChannel(name, required) {
        if (this.isInteraction()) {
            return this.interaction.options.getChannel(name, required);
        }
        else if (this.isMessage()) {
            const channelId = this.parsedArgs[name];
            if (required && (channelId === undefined || channelId === null)) {
                throw new Error(`Required option '${name}' is missing`);
            }
            if (!channelId)
                return null;
            const channel = this.client.channels.cache.get(channelId);
            if (required && !channel) {
                throw new Error(`Required channel '${name}' was not found`);
            }
            return channel;
        }
        return null;
    }
    /**
     * Gets a role option from command arguments
     * @param {string} name - The name of the option to get
     * @param {boolean} [required=false] - Whether the option is required
     * @returns {Role | null} The role, or null if not provided
     */
    getRole(name, required) {
        if (this.isInteraction()) {
            return this.interaction.options.getRole(name, required);
        }
        else if (this.isMessage()) {
            const roleId = this.parsedArgs[name];
            if (required && (roleId === undefined || roleId === null)) {
                throw new Error(`Required option '${name}' is missing`);
            }
            if (!roleId)
                return null;
            // We need to get the guild from either the message or another context
            const guild = this.isMessage() ? this.message.guild : null;
            const role = guild ? guild.roles.cache.get(roleId) : null;
            if (required && !role) {
                throw new Error(`Required role '${name}' was not found`);
            }
            return role;
        }
        return null;
    }
    /**
     * Gets a mentionable option from command arguments
     * @param {string} name - The name of the option to get
     * @param {boolean} [required=false] - Whether the option is required
     * @returns {User | Role | null} The mentionable, or null if not provided
     */
    getMentionable(name, required) {
        if (this.isInteraction()) {
            return this.interaction.options.getMentionable(name, required);
        }
        else if (this.isMessage()) {
            const mentionableId = this.parsedArgs[name];
            if (required && (mentionableId === undefined || mentionableId === null)) {
                throw new Error(`Required option '${name}' is missing`);
            }
            if (!mentionableId)
                return null;
            // Try to get as user first, then as role
            const guild = this.isMessage() ? this.message.guild : null;
            const user = this.client.users.cache.get(mentionableId);
            if (user)
                return user;
            const role = guild ? guild.roles.cache.get(mentionableId) : null;
            if (required && !user && !role) {
                throw new Error(`Required mentionable '${name}' was not found`);
            }
            return role;
        }
        return null;
    }
    /**
     * Gets an attachment option from command arguments
     * @param {string} name - The name of the option to get
     * @param {boolean} [required=false] - Whether the option is required
     * @returns {Attachment | null} The attachment, or null if not provided
     */
    getAttachment(name, required) {
        if (this.isInteraction()) {
            return this.interaction.options.getAttachment(name, required);
        }
        else if (this.isMessage()) {
            // Message commands don't have a good way to handle attachments via arguments
            if (required) {
                throw new Error("Attachments are not supported in message commands via arguments");
            }
            return null;
        }
        return null;
    }
    /**
     * Gets all options from command arguments as an object
     * @returns {Record<string, any>} An object containing all options
     */
    getOptions() {
        if (this.isInteraction()) {
            // Convert interaction options to a plain object
            const options = {};
            if (!this.interaction.isCommand())
                return {};
            const data = this.interaction.options.data;
            for (const option of data) {
                options[option.name] = option.value;
            }
            return options;
        }
        else if (this.isMessage()) {
            return { ...this.parsedArgs };
        }
        return {};
    }
    /**
     * Replies to the command, handling both interaction and message modes
     * @param {string | MessagePayload | MessageReplyOptions | InteractionReplyOptions} options - Options for the reply
     * @returns {Promise<Message | InteractionResponse | InteractionCallbackResponse>} The response
     * @throws {Error} If no valid target to reply to
     */
    async reply(options) {
        if (this.isInteraction()) {
            // TypeScript now knows interaction is defined due to improved type guard
            this.replied = true;
            return this.interaction.reply(options);
        }
        else if (this.isMessage()) {
            // TypeScript now knows message is defined due to improved type guard
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

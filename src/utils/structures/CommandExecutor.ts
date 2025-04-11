import {
  ChatInputCommandInteraction,
  Message,
  MessagePayload,
  MessageReplyOptions,
  InteractionReplyOptions,
  InteractionCallbackResponse,
  InteractionResponse,
  OmitPartialGroupDMChannel,
  User,
  InteractionEditReplyOptions,
  InteractionDeferReplyOptions,
  MessageResolvable,
  EmojiIdentifierResolvable,
  MessageReaction,
  ModalBuilder,
  APIModalInteractionResponseCallbackData,
  ModalComponentData,
  ShowModalOptions,
  ThreadChannel,
  StartThreadOptions,
  CollectorFilter,
  AwaitReactionsOptions,
  Collection,
  ReactionCollectorOptions,
  ReactionCollector,
  AwaitMessageCollectorOptionsParams,
  MessageComponentType,
  MappedInteractionTypes,
  MessageEditOptions,
} from "discord.js";
import DiscordBot from "./DiscordBot.js";

/**
 * Defines the execution mode of the command, either from a chat message or a slash command interaction
 * @typedef {'interaction' | 'message'} ExecutorMode
 */
export type ExecutorMode = "interaction" | "message";

/**
 * CommandExecutor provides a unified interface for handling both message-based and 
 * interaction-based commands. It abstracts away the differences between the two, 
 * allowing command handlers to work with either input method.
 * 
 * @template T - The execution mode, either 'interaction' or 'message'
 */
export default class CommandExecutor<T extends ExecutorMode> {
  /**
   * The interaction object if this executor was created from an interaction
   * @type {ChatInputCommandInteraction | undefined}
   */
  public interaction!: T extends "interaction" ? ChatInputCommandInteraction : undefined;
  
  /**
   * The message object if this executor was created from a message
   * @type {Message | undefined}
   */
  public message!: T extends "message" ? Message : undefined;

  /**
   * Parsed arguments as a named key-value object (for message commands)
   * @type {Record<string, any>}
   */
  public parsedArgs: Record<string, any> = {};

  /**
   * Reference to the Discord bot client
   * @type {DiscordBot}
   */
  public client: DiscordBot;

  /**
   * The name of the command being executed
   * @type {string}
   */
  public commandName: string = "";
  
  /**
   * Command arguments when in message mode (space-separated parts after the command name)
   * @type {string[] | undefined}
   */
  public arguments!: T extends "message" ? string[] : undefined
  
  /**
   * Whether the command has been replied to
   * @type {boolean}
   * @private
   */
  private replied: boolean = false;

  /**
   * Creates a new CommandExecutor
   * @param {Object} options - The options for this executor
   * @param {ChatInputCommandInteraction} [options.interaction] - The interaction that triggered this command
   * @param {Message} [options.message] - The message that triggered this command
   * @param {DiscordBot} options.client - The Discord bot client
   */
  constructor(
    options: T extends "interaction"
      ? { interaction: ChatInputCommandInteraction; client: DiscordBot }
      : { message: Message; client: DiscordBot }
  ) {
    if ("interaction" in options) {
      (this as CommandExecutor<"interaction">).interaction = options.interaction;
      (this as CommandExecutor<"interaction">).message = undefined;
      this.commandName = options.interaction.commandName;
      this.replied = options.interaction.deferred || options.interaction.replied;
    } else {
      (this as CommandExecutor<"message">).message = options.message;
      (this as CommandExecutor<"message">).interaction = undefined;

      // Better handling of prefix extraction
      const prefixLength = options.client.config.prefix.length;
      const messageContent = options.message.content.slice(prefixLength).trim();
      
      // Check if there's actual content after the prefix
      if (messageContent.length === 0) {
        this.commandName = "";
        (this as CommandExecutor<"message">).arguments = [];
      } else {
        const [cmdName, ...args] = messageContent.split(/ +/);
        this.commandName = cmdName;
        (this as CommandExecutor<"message">).arguments = args ?? [];
        
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
  public isInteraction(): this is CommandExecutor<"interaction"> & { interaction: ChatInputCommandInteraction } {
    return this.interaction !== undefined;
  }

  /**
   * Type guard: checks if this executor was created from a message
   * @returns {this is CommandExecutor<"message">} True if message is defined
   */
  public isMessage(): this is CommandExecutor<"message"> & { message: Message } {
    return this.message !== undefined;
  }

  /**
   * Type guard: checks if neither interaction nor message is defined
   * @returns {boolean} True if both interaction and message are undefined
   */
  public isDefault(): boolean {
    return this.interaction === undefined && this.message === undefined;
  }

  /**
   * Gets the execution mode of this executor
   * @returns {"interaction" | "message" | "unknown"} The execution mode
   */
  public getMode(): "interaction" | "message" | "unknown" {
    if (this.isInteraction()) return "interaction";
    if (this.isMessage()) return "message";
    return "unknown";
  }

  /**
   * Executes the appropriate callback based on the execution mode
   * @param options - Object containing callbacks for different modes
   * @returns The result of the executed callback
   */
  public withMode<T>({
    interaction,
    message,
    fallback
  }: {
    interaction?: (executor: CommandExecutor<"interaction">) => T,
    message?: (executor: CommandExecutor<"message">) => T,
    fallback?: () => T
  }): T {
    if (this.isInteraction() && interaction) {
      return interaction(this);
    } else if (this.isMessage() && message) {
      return message(this);
    } else if (fallback) {
      return fallback();
    }
    
    throw new Error("No appropriate handler found for this CommandExecutor mode");
  }

  /**
   * Gets the author/user who triggered this command
   * @returns {User} The user who initiated the command
   * @throws {TypeError} If neither message nor interaction is defined
   */
  public get getAuthor(): User {
    if (this.isMessage()) {
      return this.message.author;
    } else if (this.isInteraction()) {
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
  public getString<Required extends boolean>(name: string, required?: Required): Required extends true ? string : string | null {
    if (this.isInteraction()) {
      return this.interaction.options.getString(name, required) as Required extends true ? string : string | null;
    } else if (this.isMessage()) {
      const value = this.parsedArgs[name];
      if (required && (value === undefined || value === null)) {
        throw new Error(`Required option '${name}' is missing`);
      }
      return (value !== undefined ? String(value) : null) as Required extends true ? string : string | null;;
    }
    return (null) as Required extends true ? string : string | null;;
  }

  /**
   * Gets a number option from command arguments
   * @param {string} name - The name of the option to get
   * @param {boolean} [required=false] - Whether the option is required
   * @returns {number | null} The value of the option, or null if not provided
   */
  public getNumber<Required extends boolean = false>(
    name: string, 
    required?: Required
  ): Required extends true ? number : number | null {
    if (this.isInteraction()) {
      return this.interaction.options.getNumber(name, required as boolean) as Required extends true ? number : number | null;
    } else if (this.isMessage()) {
      const value = this.parsedArgs[name];
      if (required && (value === undefined || value === null)) {
        throw new Error(`Required option '${name}' is missing`);
      }
      return (value !== undefined ? Number(value) : null) as Required extends true ? number : number | null;
    }
    return null as Required extends true ? number : number | null;
  }

  /**
   * Gets an integer option from command arguments
   * @param {string} name - The name of the option to get
   * @param {boolean} [required=false] - Whether the option is required
   * @returns {number | null} The value of the option, or null if not provided
   */
  public getInteger<Required extends boolean = false>(
    name: string, 
    required?: Required
  ): Required extends true ? number : number | null {
    if (this.isInteraction()) {
      return this.interaction.options.getInteger(name, required as boolean) as Required extends true ? number : number | null;
    } else if (this.isMessage()) {
      const value = this.parsedArgs[name];
      if (required && (value === undefined || value === null)) {
        throw new Error(`Required option '${name}' is missing`);
      }
      return (value !== undefined ? Math.floor(Number(value)) : null) as Required extends true ? number : number | null;
    }
    return null as Required extends true ? number : number | null;
  }

  /**
   * Gets a boolean option from command arguments
   * @param {string} name - The name of the option to get
   * @param {boolean} [required=false] - Whether the option is required
   * @returns {boolean | null} The value of the option, or null if not provided
   */
  public getBoolean<Required extends boolean = false>(
    name: string, 
    required?: Required
  ): Required extends true ? boolean : boolean | null {
    if (this.isInteraction()) {
      return this.interaction.options.getBoolean(name, required as boolean) as Required extends true ? boolean : boolean | null;
    } else if (this.isMessage()) {
      const value = this.parsedArgs[name];
      if (required && (value === undefined || value === null)) {
        throw new Error(`Required option '${name}' is missing`);
      }
      return (value !== undefined ? Boolean(value) : null) as Required extends true ? boolean : boolean | null;
    }
    return null as Required extends true ? boolean : boolean | null;
  }

  /**
   * Gets a user option from command arguments
   * @param {string} name - The name of the option to get
   * @param {boolean} [required=false] - Whether the option is required
   * @returns {User | null} The user, or null if not provided
   */
  public getUser<Required extends boolean = false>(
    name: string, 
    required?: Required
  ): Required extends true ? User : User | null {
    if (this.isInteraction()) {
      return this.interaction.options.getUser(name, required as boolean) as Required extends true ? User : User | null;
    } else if (this.isMessage()) {
      const userId = this.parsedArgs[name];
      if (required && (userId === undefined || userId === null)) {
        throw new Error(`Required option '${name}' is missing`);
      }
      if (!userId) return null as Required extends true ? User : User | null;
      
      const user = this.client.users.cache.get(userId);
      if (required && !user) {
        throw new Error(`Required user '${name}' was not found`);
      }
      
      return user as Required extends true ? User : User | null;
    }
    return null as Required extends true ? User : User | null;
  }

  /**
   * Gets a channel option from command arguments
   * @param {string} name - The name of the option to get
   * @param {boolean} [required=false] - Whether the option is required
   * @returns {Channel | null} The channel, or null if not provided
   */
  public getChannel<T = any, Required extends boolean = false>(
    name: string, 
    required?: Required
  ): Required extends true ? T : T | null {
    if (this.isInteraction()) {
      return this.interaction.options.getChannel(name, required as boolean) as Required extends true ? T : T | null;
    } else if (this.isMessage()) {
      const channelId = this.parsedArgs[name];
      if (required && (channelId === undefined || channelId === null)) {
        throw new Error(`Required option '${name}' is missing`);
      }
      if (!channelId) return null as Required extends true ? T : T | null;
      
      const channel = this.client.channels.cache.get(channelId) as T;
      if (required && !channel) {
        throw new Error(`Required channel '${name}' was not found`);
      }
      
      return channel as Required extends true ? T : T | null;
    }
    return null as Required extends true ? T : T | null;
  }

  /**
   * Gets a role option from command arguments
   * @param {string} name - The name of the option to get
   * @param {boolean} [required=false] - Whether the option is required
   * @returns {Role | null} The role, or null if not provided
   */
  public getRole<T = any, Required extends boolean = false>(
    name: string, 
    required?: Required
  ): Required extends true ? T : T | null {
    if (this.isInteraction()) {
      return this.interaction.options.getRole(name, required as boolean) as Required extends true ? T : T | null;
    } else if (this.isMessage()) {
      const roleId = this.parsedArgs[name];
      if (required && (roleId === undefined || roleId === null)) {
        throw new Error(`Required option '${name}' is missing`);
      }
      if (!roleId) return null as Required extends true ? T : T | null;
      
      // We need to get the guild from either the message or another context
      const guild = this.isMessage() ? this.message.guild : null;
      const role = guild ? guild.roles.cache.get(roleId) as T : null;
      if (required && !role) {
        throw new Error(`Required role '${name}' was not found`);
      }
      
      return role as Required extends true ? T : T | null;
    }
    return null as Required extends true ? T : T | null;
  }

  /**
   * Gets a mentionable option from command arguments
   * @param {string} name - The name of the option to get
   * @param {boolean} [required=false] - Whether the option is required
   * @returns {User | Role | null} The mentionable, or null if not provided
   */
  public getMentionable<T = any, Required extends boolean = false>(
    name: string, 
    required?: Required
  ): Required extends true ? T : T | null {
    if (this.isInteraction()) {
      return this.interaction.options.getMentionable(name, required as boolean) as Required extends true ? T : T | null;
    } else if (this.isMessage()) {
      const mentionableId = this.parsedArgs[name];
      if (required && (mentionableId === undefined || mentionableId === null)) {
        throw new Error(`Required option '${name}' is missing`);
      }
      if (!mentionableId) return null as Required extends true ? T : T | null;
      
      // Try to get as user first, then as role
      const guild = this.isMessage() ? this.message.guild : null;
      const user = this.client.users.cache.get(mentionableId);
      if (user) return user as Required extends true ? T : T | null;
      
      const role = guild ? guild.roles.cache.get(mentionableId) as T : null;
      if (required && !user && !role) {
        throw new Error(`Required mentionable '${name}' was not found`);
      }
      
      return role as Required extends true ? T : T | null;
    }
    return null as Required extends true ? T : T | null;
  }

  /**
   * Gets an attachment option from command arguments
   * @param {string} name - The name of the option to get
   * @param {boolean} [required=false] - Whether the option is required
   * @returns {Attachment | null} The attachment, or null if not provided
   */
  public getAttachment<T = any, Required extends boolean = false>(
    name: string, 
    required?: Required
  ): Required extends true ? T : T | null {
    if (this.isInteraction()) {
      return this.interaction.options.getAttachment(name, required as boolean) as Required extends true ? T : T | null;
    } else if (this.isMessage()) {
      // Message commands don't have a good way to handle attachments via arguments
      if (required) {
        throw new Error("Attachments are not supported in message commands via arguments");
      }
      return null as Required extends true ? T : T | null;
    }
    return null as Required extends true ? T : T | null;
  }

  /**
   * Gets all options from command arguments as an object
   * @returns {Record<string, any>} An object containing all options
   */
  public getOptions(): Record<string, any> {
    if (this.isInteraction()) {
      // Convert interaction options to a plain object
      const options: Record<string, any> = {};
      if (!this.interaction.isCommand()) return {};
      
      const data = this.interaction.options.data;
      for (const option of data) {
        options[option.name] = option.value;
      }
      return options;
    } else if (this.isMessage()) {
      return { ...this.parsedArgs };
    }
    return {};
  }

  // Reply method overloads
  /**
   * Replies to the command with interaction response
   * @param {InteractionReplyOptions & { withResponse: true }} options - Options for the reply
   * @returns {Promise<InteractionCallbackResponse>} The interaction callback response
   */
  public reply(
    this: CommandExecutor<"interaction">,
    options: T extends "interaction"
      ? InteractionReplyOptions & { withResponse: true }
      : never
  ): T extends "interaction" ? Promise<InteractionCallbackResponse> : never;
  
  /**
   * Replies to the command with a fetchable message
   * @param {InteractionReplyOptions & { fetchReply: true }} options - Options for the reply
   * @returns {Promise<Message>} The reply message
   */
  public reply(
    this: CommandExecutor<"interaction">,
    options: T extends "interaction"
      ? InteractionReplyOptions & { fetchReply: true }
      : never
  ): T extends "interaction" ? Promise<Message> : never;
  
  /**
   * Replies to the command with interaction response
   * @param {InteractionReplyOptions} options - Options for the reply
   * @returns {Promise<InteractionResponse>} The interaction response
   */
  public reply(
    this: CommandExecutor<"interaction">,
    options: T extends "interaction" ? InteractionReplyOptions : never
  ): T extends "interaction" ? Promise<InteractionResponse> : never;
  
  /**
   * Replies to the message
   * @param {string | MessagePayload | MessageReplyOptions} options - Content or options for the reply
   * @returns {Promise<Message>} The reply message
   */
  public reply(
    this: CommandExecutor<"message">,
    options: T extends "message" ? string | MessagePayload | MessageReplyOptions : never
  ): T extends "message" ? Promise<OmitPartialGroupDMChannel<Message<boolean>>> : never;
  
  /**
   * Replies to the command, handling both interaction and message modes
   * @param {string | MessagePayload | MessageReplyOptions | InteractionReplyOptions} options - Options for the reply
   * @returns {Promise<Message | InteractionResponse | InteractionCallbackResponse>} The response
   * @throws {Error} If no valid target to reply to
   */
  public async reply(
    this: CommandExecutor<ExecutorMode>,
    options: 
        | (InteractionReplyOptions & { withResponse: true })
        | (InteractionReplyOptions & { fetchReply: true })
        | InteractionReplyOptions
        | (string | MessagePayload | MessageReplyOptions)
  ): Promise<
    | InteractionCallbackResponse
    | Message
    | InteractionResponse
    | OmitPartialGroupDMChannel<Message<boolean>>
  > {
    if (this.isInteraction()) {
      // TypeScript now knows interaction is defined due to improved type guard
      this.replied = true;
      return this.interaction.reply(options as InteractionReplyOptions);
    } else if (this.isMessage()) {
      // TypeScript now knows message is defined due to improved type guard
      return this.message.reply(options as string | MessagePayload | MessageReplyOptions);
    }
    throw new Error("No valid target to reply.");
  }

  // DeferReply overloads
  /**
   * Defers the reply to the interaction with a callback response
   * @param {InteractionDeferReplyOptions & { withResponse: true }} options - Options for deferring
   * @returns {Promise<InteractionCallbackResponse>} The interaction callback response
   */
  public async deferReply(
    this: CommandExecutor<"interaction">,
    options: InteractionDeferReplyOptions & { withResponse: true }
  ): Promise<InteractionCallbackResponse>;
  
  /**
   * Defers the reply to the interaction
   * @param {InteractionDeferReplyOptions} [options] - Options for deferring
   * @returns {Promise<InteractionResponse>} The interaction response
   */
  public async deferReply(
    this: CommandExecutor<"interaction">,
    options?: InteractionDeferReplyOptions
  ): Promise<InteractionResponse>;
  
  /**
   * No-op for message mode
   * @returns {Promise<void>}
   */
  public async deferReply(
    this: CommandExecutor<"message">
  ): Promise<void>;
  
  /**
   * Defers the reply to the command, handling both interaction and message modes
   * @param {InteractionDeferReplyOptions} [options] - Options for deferring
   * @returns {Promise<InteractionCallbackResponse | InteractionResponse | void>} The response or void
   */
  public async deferReply(
    this: CommandExecutor<ExecutorMode>,
    options?: InteractionDeferReplyOptions & { withResponse?: true }
  ): Promise<InteractionCallbackResponse | InteractionResponse<boolean> | void> {
    if (this.isInteraction()) {
      const result = await this.interaction.deferReply(options);
      this.replied = true;
      return result;
    }
    // For message mode, this is a no-op
    return Promise.resolve();
  }

  // EditReply overloads
  /**
   * Edits the reply to the interaction
   * @param {string | MessagePayload | InteractionEditReplyOptions} options - New content or options
   * @returns {Promise<Message>} The edited message
   */
  public async editReply(
    this: CommandExecutor<"interaction">,
    options: string | MessagePayload | InteractionEditReplyOptions
  ): Promise<Message<boolean>>;
  
  /**
   * Edits a specific message in message mode
   * @param {Message} messageToEdit - The message to edit
   * @param {string | MessagePayload | MessageReplyOptions} options - Content or options
   * @returns {Promise<Message>} The edited message
   */
  public async editReply(
    this: CommandExecutor<"message">,
    messageToEdit: Message<boolean>,
    options: string | MessagePayload | MessageEditOptions
  ): Promise<Message<boolean>>;
  
  /**
   * Edits the reply or specified message
   * @param {string | MessagePayload | InteractionEditReplyOptions | Message} optionsOrMessage - Options for editing or message to edit
   * @param {string | MessagePayload | MessageReplyOptions} [messageOptions] - Options when editing a specific message
   * @returns {Promise<Message>} The edited message
   * @throws {Error} If no valid target to edit
   */
  public async editReply(
    this: CommandExecutor<ExecutorMode>,
    optionsOrMessage: string | MessagePayload | InteractionEditReplyOptions | Message<boolean>,
    messageOptions?: string | MessagePayload | MessageEditOptions
  ): Promise<Message<boolean>> {
    if (this.isInteraction()) {
      if (!this.replied) {
        await this.deferReply();
      }
      return this.interaction.editReply(optionsOrMessage as string | MessagePayload | InteractionEditReplyOptions);
    } else if (this.isMessage()) {
      // If first argument is a Message object, edit it
      if (optionsOrMessage instanceof Message) {
        if (!messageOptions) {
          throw new Error("Message options are required when editing a message");
        }
        return optionsOrMessage.edit(messageOptions);
      }
      
      // Otherwise, reply with a new message
      return this.message.reply(optionsOrMessage as string | MessagePayload | MessageReplyOptions);
    }
    throw new Error("CommandExecutor: Both is not defined.");
  }

  // Delete/DeleteReply methods
  /**
   * Deletes the message in message mode
   * @returns {Promise<Message>} The deleted message
   */
  public async delete(
    this: CommandExecutor<"message">
  ): Promise<Message<boolean>>;
  
  /**
   * Deletes the reply in interaction mode
   * @returns {Promise<void>}
   */
  public async delete(
    this: CommandExecutor<"interaction">
  ): Promise<void>;
  
  /**
   * Deletes the message or reply, handling both modes
   * @returns {Promise<Message | void>} The deleted message or void
   * @throws {Error} If no valid target to delete
   */
  public async delete(
    this: CommandExecutor<ExecutorMode>
  ): Promise<Message<boolean> | void> {
    if (this.isInteraction()) {
      return this.deleteReply();
    } else if (this.isMessage()) {
      return this.message.delete();
    }
    throw new Error("No valid target to delete.");
  }

  // DeleteReply method with overloads
  /**
   * Deletes a reply to the interaction
   * @param {MessageResolvable | '@original'} [message='@original'] - The message to delete
   * @returns {Promise<void>}
   */
  public async deleteReply(
    this: CommandExecutor<"interaction">,
    message?: MessageResolvable | '@original'
  ): Promise<void>;
  
  /**
   * Deletes the message in message mode
   * @returns {Promise<Message>} The deleted message
   */
  public async deleteReply(
    this: CommandExecutor<"message">
  ): Promise<Message<boolean>>;
  
  /**
   * Deletes a reply or message, handling both modes
   * @param {MessageResolvable | '@original'} [message='@original'] - The message to delete in interaction mode
   * @returns {Promise<void | Message>} Void or the deleted message
   * @throws {Error} If no valid target for deletion
   */
  public async deleteReply(
    this: CommandExecutor<ExecutorMode>,
    message?: MessageResolvable | '@original'
  ): Promise<void | Message<boolean>> {
    if (this.isInteraction()) {
      return this.interaction.deleteReply(message as '@original');
    } else if (this.isMessage()) {
      return this.message.delete();
    }
    throw new Error("No valid target for delete operation.");
  }

  // FetchReply method
  /**
   * Fetches a reply to the interaction
   * @param {MessageResolvable | '@original'} [message='@original'] - The message to fetch
   * @returns {Promise<Message>} The fetched message
   */
  public async fetchReply(
    this: CommandExecutor<"interaction">,
    message?: '@original'
  ): Promise<Message<boolean>>;
  
  /**
   * Returns the original message in message mode
   * @returns {Promise<Message>} The message
   */
  public async fetchReply(
    this: CommandExecutor<"message">
  ): Promise<Message<boolean>>;
  
  /**
   * Fetches a reply or returns the message, handling both modes
   * @param {MessageResolvable | '@original'} [message='@original'] - The message to fetch in interaction mode
   * @returns {Promise<Message>} The message
   * @throws {Error} If no valid target to fetch
   */
  public async fetchReply(
    this: CommandExecutor<ExecutorMode>,
    message?: MessageResolvable | '@original'
  ): Promise<Message<boolean>> {
    if (this.isInteraction()) {
      return this.interaction.fetchReply(message as '@original' | string);
    } else if (this.isMessage()) {
      return this.message;
    }
    throw new Error("No valid target for fetch operation.");
  }

  // FollowUp method
  /**
   * Sends a follow-up message to the interaction
   * @param {string | MessagePayload | InteractionReplyOptions} options - Content or options
   * @returns {Promise<Message>} The follow-up message
   */
  public async followUp(
    this: CommandExecutor<"interaction">,
    options: string | MessagePayload | InteractionReplyOptions
  ): Promise<Message<boolean>>;
  
  /**
   * Sends a new reply in message mode (equivalent to reply)
   * @param {string | MessagePayload | MessageReplyOptions} options - Content or options
   * @returns {Promise<Message>} The reply message
   */
  public async followUp(
    this: CommandExecutor<"message">,
    options: string | MessagePayload | MessageReplyOptions
  ): Promise<OmitPartialGroupDMChannel<Message<boolean>>>;
  
  /**
   * Sends a follow-up message, handling both modes
   * @param {string | MessagePayload | InteractionReplyOptions | MessageReplyOptions} options - Content or options
   * @returns {Promise<Message>} The follow-up or reply message
   * @throws {Error} If no valid target for follow-up
   */
  public async followUp(
    this: CommandExecutor<ExecutorMode>,
    options: string | MessagePayload | InteractionReplyOptions | MessageReplyOptions
  ): Promise<Message<boolean> | OmitPartialGroupDMChannel<Message<boolean>>> {
    if (this.isInteraction()) {
      return this.interaction.followUp(options as string | MessagePayload | InteractionReplyOptions);
    } else if (this.isMessage()) {
      return this.message.reply(options as string | MessagePayload | MessageReplyOptions);
    }
    throw new Error("No valid target for follow-up message.");
  }

  // React method (adds reaction to messages, not available directly for interactions)
  /**
   * Adds a reaction to the message
   * @param {EmojiIdentifierResolvable} emoji - The emoji to react with
   * @returns {Promise<MessageReaction>} The added reaction
   */
  public async react(
    this: CommandExecutor<"message">,
    emoji: EmojiIdentifierResolvable
  ): Promise<MessageReaction>;
  
  /**
   * Adds a reaction to the reply message in interaction mode
   * @param {EmojiIdentifierResolvable} emoji - The emoji to react with
   * @returns {Promise<MessageReaction>} The added reaction
   */
  public async react(
    this: CommandExecutor<"interaction">,
    emoji: EmojiIdentifierResolvable
  ): Promise<MessageReaction>;
  
  /**
   * Adds a reaction to the message or reply, handling both modes
   * @param {EmojiIdentifierResolvable} emoji - The emoji to react with
   * @returns {Promise<MessageReaction>} The added reaction
   * @throws {Error} If no valid target for reaction
   */
  public async react(
    this: CommandExecutor<ExecutorMode>,
    emoji: EmojiIdentifierResolvable
  ): Promise<MessageReaction> {
    if (this.isMessage()) {
      return this.message.react(emoji);
    } else if (this.isInteraction()) {
      const reply = await this.fetchReply();
      return reply.react(emoji);
    }
    throw new Error("No valid target for reaction.");
  }

  // Pin/Unpin methods
  /**
   * Pins the message to the channel
   * @param {string} [reason] - Reason for pinning
   * @returns {Promise<Message>} The pinned message
   */
  public async pin(
    this: CommandExecutor<"message">,
    reason?: string
  ): Promise<Message<boolean>>;
  
  /**
   * Pins the reply message to the channel
   * @param {string} [reason] - Reason for pinning
   * @returns {Promise<Message>} The pinned message
   */
  public async pin(
    this: CommandExecutor<"interaction">,
    reason?: string
  ): Promise<Message<boolean>>;
  
  /**
   * Pins the message or reply, handling both modes
   * @param {string} [reason] - Reason for pinning
   * @returns {Promise<Message>} The pinned message
   * @throws {Error} If no valid target for pin operation
   */
  public async pin(
    this: CommandExecutor<ExecutorMode>,
    reason?: string
  ): Promise<Message<boolean>> {
    if (this.isMessage()) {
      return this.message.pin(reason);
    } else if (this.isInteraction()) {
      const reply = await this.fetchReply();
      return reply.pin(reason);
    }
    throw new Error("No valid target for pin operation.");
  }

  /**
   * Unpins the message from the channel
   * @param {string} [reason] - Reason for unpinning
   * @returns {Promise<Message>} The unpinned message
   */
  public async unpin(
    this: CommandExecutor<"message">,
    reason?: string
  ): Promise<Message<boolean>>;
  
  /**
   * Unpins the reply message from the channel
   * @param {string} [reason] - Reason for unpinning
   * @returns {Promise<Message>} The unpinned message
   */
  public async unpin(
    this: CommandExecutor<"interaction">,
    reason?: string
  ): Promise<Message<boolean>>;
  
  /**
   * Unpins the message or reply, handling both modes
   * @param {string} [reason] - Reason for unpinning
   * @returns {Promise<Message>} The unpinned message
   * @throws {Error} If no valid target for unpin operation
   */
  public async unpin(
    this: CommandExecutor<ExecutorMode>,
    reason?: string
  ): Promise<Message<boolean>> {
    if (this.isMessage()) {
      return this.message.unpin(reason);
    } else if (this.isInteraction()) {
      const reply = await this.fetchReply();
      return reply.unpin(reason);
    }
    throw new Error("No valid target for unpin operation.");
  }

  // ShowModal - only available for interactions
  /**
   * Shows a modal component to the user
   * @param {ModalBuilder | ModalComponentData | APIModalInteractionResponseCallbackData} modal - The modal to show
   * @param {ShowModalOptions} [options] - Options for showing the modal
   * @returns {Promise<InteractionCallbackResponse | undefined>} The interaction response
   */
  public async showModal(
    this: CommandExecutor<"interaction">,
    modal: ModalBuilder | ModalComponentData | APIModalInteractionResponseCallbackData,
    options?: ShowModalOptions
  ): Promise<InteractionCallbackResponse | undefined>;
  
  /**
   * Shows a modal component to the user (interaction mode only)
   * @param {ModalBuilder | ModalComponentData | APIModalInteractionResponseCallbackData} modal - The modal to show
   * @param {ShowModalOptions} [options] - Options for showing the modal
   * @returns {Promise<InteractionCallbackResponse | undefined>} The interaction response
   * @throws {Error} If used in message mode
   */
  public async showModal(
    this: CommandExecutor<ExecutorMode>,
    modal: ModalBuilder | ModalComponentData | APIModalInteractionResponseCallbackData,
    options?: ShowModalOptions
  ): Promise<InteractionCallbackResponse | undefined> {
    if (this.isInteraction()) {
      this.replied = true;
      return this.interaction.showModal(modal, options);
    }
    throw new Error("ShowModal is only available for interactions.");
  }

  // SuppressEmbeds - works on both
  /**
   * Suppresses or unsuppresses embeds on the message
   * @param {boolean} [suppress=true] - Whether to suppress embeds
   * @returns {Promise<Message>} The updated message
   */
  public async suppressEmbeds(
    this: CommandExecutor<"message">,
    suppress?: boolean
  ): Promise<Message<boolean>>;
  
  /**
   * Suppresses or unsuppresses embeds on the reply message
   * @param {boolean} [suppress=true] - Whether to suppress embeds
   * @returns {Promise<Message>} The updated message
   */
  public async suppressEmbeds(
    this: CommandExecutor<"interaction">,
    suppress?: boolean
  ): Promise<Message<boolean>>;
  
  /**
   * Suppresses or unsuppresses embeds on the message or reply
   * @param {boolean} [suppress=true] - Whether to suppress embeds
   * @returns {Promise<Message>} The updated message
   * @throws {Error} If no valid target for the operation
   */
  public async suppressEmbeds(
    this: CommandExecutor<ExecutorMode>,
    suppress: boolean = true
  ): Promise<Message<boolean>> {
    if (this.isMessage()) {
      return this.message.suppressEmbeds(suppress);
    } else if (this.isInteraction()) {
      const reply = await this.fetchReply();
      return reply.suppressEmbeds(suppress);
    }
    throw new Error("No valid target for suppress embeds operation.");
  }

  // StartThread method
  /**
   * Creates a new thread from the message
   * @param {StartThreadOptions} options - Options for creating the thread
   * @returns {Promise<ThreadChannel>} The created thread
   */
  public async startThread(
    this: CommandExecutor<"message">,
    options: StartThreadOptions
  ): Promise<ThreadChannel>;
  
  /**
   * Creates a new thread from the reply message
   * @param {StartThreadOptions} options - Options for creating the thread
   * @returns {Promise<ThreadChannel>} The created thread
   */
  public async startThread(
    this: CommandExecutor<"interaction">,
    options: StartThreadOptions
  ): Promise<ThreadChannel>;
  
  /**
   * Creates a new thread from the message or reply
   * @param {StartThreadOptions} options - Options for creating the thread
   * @returns {Promise<ThreadChannel>} The created thread
   * @throws {Error} If no valid target for starting a thread
   */
  public async startThread(
    this: CommandExecutor<ExecutorMode>,
    options: StartThreadOptions
  ): Promise<ThreadChannel> {
    if (this.isMessage()) {
      return this.message.startThread(options);
    } else if (this.isInteraction()) {
      const reply = await this.fetchReply();
      return reply.startThread(options);
    }
    throw new Error("No valid target for starting thread.");
  }

  // Crosspost method (only for announcements)
  /**
   * Crossposts the message to announcement channels that follow this channel
   * @returns {Promise<Message>} The crossposted message
   */
  public async crosspost(
    this: CommandExecutor<"message">
  ): Promise<Message<boolean>>;
  
  /**
   * Crossposts the reply message to announcement channels that follow this channel
   * @returns {Promise<Message>} The crossposted message
   */
  public async crosspost(
    this: CommandExecutor<"interaction">
  ): Promise<Message<boolean>>;
  
  /**
   * Crossposts the message or reply to announcement channels
   * @returns {Promise<Message>} The crossposted message
   * @throws {Error} If no valid target for crosspost or not in an announcement channel
   */
  public async crosspost(
    this: CommandExecutor<ExecutorMode>
  ): Promise<Message<boolean>> {
    if (this.isMessage()) {
      return this.message.crosspost();
    } else if (this.isInteraction()) {
      const reply = await this.fetchReply();
      return reply.crosspost();
    }
    throw new Error("No valid target for crosspost operation.");
  }

  // AwaitMessageComponent method
  /**
   * Collects a message component interaction from the message
   * @template T - The type of component to collect
   * @param {AwaitMessageCollectorOptionsParams<T>} [options] - Options for collecting
   * @returns {Promise<MappedInteractionTypes<boolean>[T]>} The collected interaction
   */
  public async awaitMessageComponent<T extends MessageComponentType = MessageComponentType>(
    this: CommandExecutor<"message">,
    options?: AwaitMessageCollectorOptionsParams<T>
  ): Promise<MappedInteractionTypes<boolean>[T]>;
  
  /**
   * Collects a message component interaction from the reply message
   * @template T - The type of component to collect
   * @param {AwaitMessageCollectorOptionsParams<T>} [options] - Options for collecting
   * @returns {Promise<MappedInteractionTypes<boolean>[T]>} The collected interaction
   */
  public async awaitMessageComponent<T extends MessageComponentType = MessageComponentType>(
    this: CommandExecutor<"interaction">,
    options?: AwaitMessageCollectorOptionsParams<T>
  ): Promise<MappedInteractionTypes<boolean>[T]>;
  
  /**
   * Collects a message component interaction from the message or reply
   * @template T - The type of component to collect
   * @param {AwaitMessageCollectorOptionsParams<T>} [options] - Options for collecting
   * @returns {Promise<MappedInteractionTypes<boolean>[T]>} The collected interaction
   * @throws {Error} If no valid target for collecting components
   */
  public async awaitMessageComponent<T extends MessageComponentType = MessageComponentType>(
    this: CommandExecutor<ExecutorMode>,
    options?: AwaitMessageCollectorOptionsParams<T>
  ): Promise<MappedInteractionTypes<boolean>[T]> {
    if (this.isMessage()) {
      return this.message.awaitMessageComponent(options);
    } else if (this.isInteraction()) {
      const reply = await this.fetchReply();
      return reply.awaitMessageComponent(options);
    }
    throw new Error("No valid target for awaiting message component.");
  }
  
  // AwaitReactions method
  /**
   * Collects reactions on the message
   * @param {AwaitReactionsOptions} [options] - Options for collecting reactions
   * @returns {Promise<Collection<string, MessageReaction>>} Collection of collected reactions
   */
  public async awaitReactions(
    this: CommandExecutor<"message">,
    options?: AwaitReactionsOptions
  ): Promise<Collection<string, MessageReaction>>;
  
  /**
   * Collects reactions on the reply message
   * @param {AwaitReactionsOptions} [options] - Options for collecting reactions
   * @returns {Promise<Collection<string, MessageReaction>>} Collection of collected reactions
   */
  public async awaitReactions(
    this: CommandExecutor<"interaction">,
    options?: AwaitReactionsOptions
  ): Promise<Collection<string, MessageReaction>>;
  
  /**
   * Collects reactions on the message or reply
   * @param {AwaitReactionsOptions} [options] - Options for collecting reactions
   * @returns {Promise<Collection<string, MessageReaction>>} Collection of collected reactions
   * @throws {Error} If no valid target for collecting reactions
   */
  public async awaitReactions(
    this: CommandExecutor<ExecutorMode>,
    options?: AwaitReactionsOptions
  ): Promise<Collection<string, MessageReaction>> {
    if (this.isMessage()) {
      return this.message.awaitReactions(options);
    } else if (this.isInteraction()) {
      const reply = await this.fetchReply();
      return reply.awaitReactions(options);
    }
    throw new Error("No valid target for awaiting reactions.");
  }

  // CreateReactionCollector
  /**
   * Creates a collector for reactions on the message
   * @param {ReactionCollectorOptions} [options] - Options for the collector
   * @returns {Promise<ReactionCollector>} The reaction collector
   */
  public createReactionCollector(
    this: CommandExecutor<"message">,
    options?: ReactionCollectorOptions
  ): Promise<ReactionCollector>;
  
  /**
   * Creates a collector for reactions on the reply message
   * @param {ReactionCollectorOptions} [options] - Options for the collector
   * @returns {Promise<ReactionCollector>} The reaction collector
   */
  public createReactionCollector(
    this: CommandExecutor<"interaction">,
    options?: ReactionCollectorOptions
  ): Promise<ReactionCollector>;
  
  /**
   * Creates a collector for reactions on the message or reply
   * @param {ReactionCollectorOptions} [options] - Options for the collector
   * @returns {Promise<ReactionCollector>} The reaction collector
   * @throws {Error} If no valid target for collecting reactions
   */
  public async createReactionCollector(
    this: CommandExecutor<ExecutorMode>,
    options?: ReactionCollectorOptions
  ): Promise<ReactionCollector> {
    if (this.isMessage()) {
      return this.message.createReactionCollector(options);
    } else if (this.isInteraction()) {
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
  public async awaitModalSubmit(
    this: CommandExecutor<"interaction">, 
    options: { filter?: CollectorFilter<[any]>, time: number }
  ): Promise<any> {
    if (this.isInteraction()) {
      return this.interaction.awaitModalSubmit(options);
    }
    throw new Error("AwaitModalSubmit is only available for interactions.");
  }
  
  // Fetch method
  /**
   * Fetches the message from the API
   * @param {boolean} [force=true] - Whether to force fetch from the API
   * @returns {Promise<Message>} The fetched message
   */
  public async fetch(
    this: CommandExecutor<"message">,
    force?: boolean
  ): Promise<Message>;
  
  /**
   * Fetches the reply message
   * @returns {Promise<Message>} The fetched message
   */
  public async fetch(
    this: CommandExecutor<"interaction">
  ): Promise<Message>;
  
  /**
   * Fetches the message or reply
   * @param {boolean} [force] - Whether to force fetch from the API in message mode
   * @returns {Promise<Message>} The fetched message
   * @throws {Error} If no valid target for fetch operation
   */
  public async fetch(
    this: CommandExecutor<ExecutorMode>,
    force?: boolean
  ): Promise<Message> {
    if (this.isMessage()) {
      return this.message.fetch(force);
    } else if (this.isInteraction()) {
      return this.fetchReply();
    }
    throw new Error("No valid target for fetch operation.");
  }

  // Remove attachments
  /**
   * Removes all attachments from the message
   * @returns {Promise<Message>} The updated message
   */
  public async removeAttachments(
    this: CommandExecutor<"message">
  ): Promise<Message>;
  
  /**
   * Removes all attachments from the reply message
   * @returns {Promise<Message>} The updated message
   */
  public async removeAttachments(
    this: CommandExecutor<"interaction">
  ): Promise<Message>;
  
  /**
   * Removes all attachments from the message or reply
   * @returns {Promise<Message>} The updated message
   * @throws {Error} If no valid target for removing attachments
   */
  public async removeAttachments(
    this: CommandExecutor<ExecutorMode>
  ): Promise<Message> {
    if (this.isMessage()) {
      return this.message.removeAttachments();
    } else if (this.isInteraction()) {
      const reply = await this.fetchReply();
      return reply.removeAttachments();
    }
    throw new Error("No valid target for removing attachments.");
  }
}

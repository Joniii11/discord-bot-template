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
} from "discord.js";
import DiscordBot from "./DiscordBot.js";

export type ExecutorMode = "interaction" | "message";

export default class CommandExecutor<T extends ExecutorMode> {
  public interaction!: T extends "interaction" ? ChatInputCommandInteraction : undefined;
  public message!: T extends "message" ? Message : undefined

  public client: DiscordBot;

  public commandName: string = "";
  public arguments!: T extends "message" ? string[] : undefined
  private replied: boolean = false;

  constructor(
    options: T extends "interaction"
      ? { interaction: ChatInputCommandInteraction; client: DiscordBot }
      : { message: Message; client: DiscordBot }
  ) {
    if ("interaction" in options) {
      (this as CommandExecutor<"interaction">).interaction = options.interaction;
      (this as CommandExecutor<"interaction">).message = undefined;
      this.commandName = options.interaction.commandName;
      this.replied = options.interaction.deferred
    } else {
      (this as CommandExecutor<"message">).message = options.message;
      (this as CommandExecutor<"message">).interaction = undefined;

      const [cmdName, ...args] = options.message.content.slice(options.client.config.prefix.length).trim().split(/ +/);
      (this as CommandExecutor<"message">).arguments = args ?? [];
      this.commandName = cmdName;
    }

    this.client = options.client;
  }

  /**
   * Type guard: returns true if interaction is defined.
   */
  public isInteraction(): this is { interaction: ChatInputCommandInteraction } & CommandExecutor<"interaction"> {
    return this.interaction !== undefined;
  }

  /**
   * Type guard: returns true if message is defined
   * yeah it wokrs.
   */
  public isMessage(): this is { message: Message } & CommandExecutor<"message"> {
    return this.message !== undefined;
  }

  /**
   * Type guard: returns true if both interaction and message are undefined.
   */
  public isDefault(): boolean {
    return this.interaction === undefined && this.message === undefined;
  }

  public get getAuthor(): User {
    if (this.isMessage()) {
      return this.message.author;
    } else if (this.isInteraction()) {
      return this.interaction.user;
    }
    throw new TypeError("Both message and interaction were not provided.");
  }

  public reply(
    this: CommandExecutor<"interaction">,
    options: T extends "interaction"
      ? InteractionReplyOptions & { withResponse: true }
      : never
  ): T extends "interaction" ? Promise<InteractionCallbackResponse> : never;
  public reply(
    this: CommandExecutor<"interaction">,
    options: T extends "interaction"
      ? InteractionReplyOptions & { fetchReply: true }
      : never
  ): T extends "interaction" ? Promise<Message> : never;
  public reply(
    this: CommandExecutor<"interaction">,
    options: T extends "interaction" ? InteractionReplyOptions : never
  ): T extends "interaction" ? Promise<InteractionResponse> : never;

  public reply(
    this: CommandExecutor<"message">,
    options: T extends "message" ? string | MessagePayload | MessageReplyOptions : never
  ): T extends "message" ? Promise<OmitPartialGroupDMChannel<Message<boolean>>> : never

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
      return this.interaction.reply(options as InteractionReplyOptions)
    } else if (this.isMessage()) {
      return this.message.reply(options as string | MessagePayload | MessageReplyOptions)
  }
    throw new Error("No valid target to reply.");
  };
  // Overload declarations
  public async deferReply(
    this: CommandExecutor<"interaction">,
    options: InteractionDeferReplyOptions & { withResponse: true }
  ): Promise<InteractionCallbackResponse>;

  public async deferReply(
    this: CommandExecutor<"interaction">,
    options?: InteractionDeferReplyOptions
  ): Promise<InteractionResponse>;

  // Implementation signature
  public async deferReply(
    this: CommandExecutor<any>,
    options?: InteractionDeferReplyOptions & { withResponse?: true }
  ): Promise<InteractionCallbackResponse | InteractionDeferReplyOptions | InteractionResponse<boolean> | void> {
    if (!this.isInteraction()) return;

    const result = await this.interaction.deferReply(options);
    console.log(result)
    if (result) this.replied = true;

    return result;
  }


  public async editReply(
    this: CommandExecutor<"interaction">,
    options: string | MessagePayload | InteractionEditReplyOptions
  ): Promise<Message<boolean>>;
  
  // Overload for message mode
  public async editReply(
    this: CommandExecutor<"message">,
    options: string | MessagePayload | MessageReplyOptions
  ): Promise<OmitPartialGroupDMChannel<Message<boolean>>>;
  
  public async editReply(
    this: CommandExecutor<ExecutorMode>,
    options: string | MessagePayload | InteractionEditReplyOptions | MessageReplyOptions
  ): Promise<Message<boolean> | OmitPartialGroupDMChannel<Message<boolean>>> {
    if (this.isInteraction()) {
      this.replied ? await this.deferReply() : null;
      console.log((this.replied), "mauw")

      return this.interaction.editReply(options as InteractionEditReplyOptions);
    } else if (this.isMessage()) {
      return this.message.reply(options as string | MessagePayload | MessageReplyOptions);
    }
  
    throw new Error("CommandExecutor: Both is not defined.");
  }
}

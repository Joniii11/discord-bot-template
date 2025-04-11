import {
  APIApplicationCommandOptionChoice,
  ApplicationCommandChoicesData,
  ApplicationCommandOptionType,
  ModalSubmitInteractionCollectorOptions,
  PermissionsString,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandBuilder,
  PermissionResolvable,
} from "discord.js";
import CommandExecutor, { ExecutorMode } from "../structures/CommandExecutor.js";
import { __dirnamePop, __dirnamePopulator } from "../__dirname.js";

export interface CommandPermissions {
  userPermissions?: PermissionResolvable[];
  botPermissions?: PermissionResolvable[];
  ownerOnly?: boolean;
  guildOnly?: boolean;
  dmOnly?: boolean;

  /** Specific role IDs that can use this command */
  roleIds?: string[];
}

export interface CommandOptions {
  cooldown?: number;
  aliases?: string[];
  category?: string;
  slashOnly?: boolean;
  permissions?: CommandPermissions;
}

export interface BaseCommand<T extends ExecutorMode = ExecutorMode> {
  name: string;
  data: SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandBuilder;
  options?: CommandOptions;

  execute: (commandExecutor: CommandExecutor<T>) => Promise<unknown> | unknown;
}

export interface ImportedBaseCommand {
  data: BaseCommand;
};

export type SlashOnlyOptions = { slashOnly: true, messageOnly?: false };
export type MessageOnlyOptions = { slashOnly?: false, messageOnly: true };
export type BothOptions = { slashOnly?: false, messageOnly?: false };

export function commandFile<
  T extends Partial<CommandOptions> & (SlashOnlyOptions | MessageOnlyOptions | BothOptions)> (
  command: {
    name?: string;
    data: SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandBuilder;
    options?: T;
    execute: (
      commandExecutor: CommandExecutor<
        T extends SlashOnlyOptions
          ? "interaction"
          : T extends MessageOnlyOptions
          ? "message"
          : ExecutorMode
      >
    ) => Promise<unknown> | unknown;
  }
): BaseCommand<
  T extends SlashOnlyOptions
    ? "interaction"
    : T extends MessageOnlyOptions
    ? "message"
    : ExecutorMode
> {
  return {
    name: command.data.name,
    data: command.data,
    options: {
        ...command.options,
        category: command.options?.category ?? "null",
        cooldown: command.options?.cooldown ?? 0,
        aliases: command.options?.aliases ?? []
    } as CommandOptions,
    execute: command.execute,
  };
}

export interface MissingArgumentString {
  type: ApplicationCommandOptionType.String;
  max_length?: boolean;
  min_length?: boolean;
  choices?: MissingArgumentChoice
  name: string;
}

export interface MissingArgumentChoiceTrue {
  is: true;
  choices: [] | APIApplicationCommandOptionChoice<string>[]
};

export interface MissingArgumentChoiceFalse {
  is: false;
  choices: never;
};

export type MissingArgumentChoice = MissingArgumentChoiceTrue | MissingArgumentChoiceFalse;

export interface MissingArgumentOther {
  type: ApplicationCommandOptionType;
  name: string;
};

export type MissingArguments = MissingArgumentOther | MissingArgumentString;
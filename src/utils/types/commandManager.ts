import {
  APIApplicationCommandOptionChoice,
  ApplicationCommandChoicesData,
  ApplicationCommandOptionType,
  ModalSubmitInteractionCollectorOptions,
    SlashCommandOptionsOnlyBuilder,
    SlashCommandSubcommandBuilder,
} from "discord.js";
import CommandExecutor, { ExecutorMode } from "../structures/CommandExecutor.js";
import { __dirnamePop, __dirnamePopulator } from "../__dirname.js";

export interface BaseCommand<T extends ExecutorMode = ExecutorMode> {
  name: string;
  data: SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandBuilder;
  options?: CommandOptions;

  execute: (commandExecutor: CommandExecutor<T>) => Promise<unknown> | unknown;
}

export interface BaseOptions {
  category: string;
  cooldown: number;
  aliases: string[];
}
    

export interface OptionsSlash extends BaseOptions {
  slashOnly: true;
  messageOnly?: false;
}

export interface OptionsMsg extends BaseOptions {
  slashOnly?: false;
  messageOnly: true;
}

export interface OptionsBoth extends BaseOptions {
  slashOnly?: false;
  messageOnly?: false;
}

export interface ImportedBaseCommand {
  data: BaseCommand;
};

export type CommandOptions = OptionsMsg | OptionsSlash | OptionsBoth;

export function commandFile<T extends Omit<CommandOptions, "category" | "cooldown" | "aliases"> & Partial<CommandOptions>>(
  command: {
    name?: string;
    data: SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandBuilder;
    options?: T;
    execute: (
      commandExecutor: CommandExecutor<
        T extends OptionsSlash
          ? "interaction"
          : T extends OptionsMsg
          ? "message"
          : ExecutorMode
      >
    ) => Promise<unknown>;
  }
): BaseCommand<
  T extends OptionsSlash
    ? "interaction"
    : T extends OptionsMsg
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
    execute: command.execute as (
      commandExecutor: CommandExecutor<ExecutorMode>
    ) => Promise<unknown>,
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
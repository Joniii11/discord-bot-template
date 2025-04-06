import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonInteraction, 
  ModalBuilder, 
  ModalSubmitInteraction, 
  SelectMenuBuilder, 
  SelectMenuInteraction,
  StringSelectMenuBuilder,
  StringSelectMenuInteraction,
  UserSelectMenuBuilder,
  UserSelectMenuInteraction,
  RoleSelectMenuBuilder,
  RoleSelectMenuInteraction,
  ChannelSelectMenuBuilder,
  ChannelSelectMenuInteraction,
  MentionableSelectMenuBuilder,
  MentionableSelectMenuInteraction,
  AnyComponentBuilder
} from "discord.js";
import DiscordBot from "../structures/DiscordBot.js";

// Base component interface
export interface BaseComponent<T extends ComponentType = ComponentType> {
  id: string;
  type: T;
  execute: ComponentExecuteFunction<T>;
  options?: ComponentOptions;
}

// Component execution function types
export type ComponentExecuteFunction<T extends ComponentType> = 
  T extends "button" ? ButtonExecuteFunction :
  T extends "stringSelect" ? StringSelectExecuteFunction :
  T extends "userSelect" ? UserSelectExecuteFunction :
  T extends "roleSelect" ? RoleSelectExecuteFunction :
  T extends "channelSelect" ? ChannelSelectExecuteFunction :
  T extends "mentionableSelect" ? MentionableSelectExecuteFunction :
  T extends "modal" ? ModalExecuteFunction :
  never;

export type ButtonExecuteFunction = (client: DiscordBot, interaction: ButtonInteraction) => Promise<unknown> | unknown;
export type StringSelectExecuteFunction = (client: DiscordBot, interaction: StringSelectMenuInteraction) => Promise<unknown> | unknown;
export type UserSelectExecuteFunction = (client: DiscordBot, interaction: UserSelectMenuInteraction) => Promise<unknown> | unknown;
export type RoleSelectExecuteFunction = (client: DiscordBot, interaction: RoleSelectMenuInteraction) => Promise<unknown> | unknown;
export type ChannelSelectExecuteFunction = (client: DiscordBot, interaction: ChannelSelectMenuInteraction) => Promise<unknown> | unknown;
export type MentionableSelectExecuteFunction = (client: DiscordBot, interaction: MentionableSelectMenuInteraction) => Promise<unknown> | unknown;
export type ModalExecuteFunction = (client: DiscordBot, interaction: ModalSubmitInteraction) => Promise<unknown> | unknown;

// Component types
export type ComponentType = "button" | "stringSelect" | "userSelect" | "roleSelect" | "channelSelect" | "mentionableSelect" | "modal";

// Component options
export interface ComponentOptions {
  cooldown?: number;
  category?: string;
}

// Builder types for different components
export type ComponentBuilder<T extends ComponentType> = 
  T extends "button" ? ButtonBuilder :
  T extends "stringSelect" ? StringSelectMenuBuilder :
  T extends "userSelect" ? UserSelectMenuBuilder :
  T extends "roleSelect" ? RoleSelectMenuBuilder :
  T extends "channelSelect" ? ChannelSelectMenuBuilder :
  T extends "mentionableSelect" ? MentionableSelectMenuBuilder :
  T extends "modal" ? ModalBuilder :
  never;

// Pattern match for dynamic component IDs
export interface PatternComponent<T extends ComponentType = ComponentType> extends BaseComponent<T> {
  idPattern: RegExp;
}

// Component registration helpers
export function buttonComponent(options: {
  id: string;
  execute: ButtonExecuteFunction;
  options?: ComponentOptions;
}): BaseComponent<"button"> {
  return {
    id: options.id,
    type: "button",
    execute: options.execute,
    options: options.options
  };
}

export function stringSelectComponent(options: {
  id: string;
  execute: StringSelectExecuteFunction;
  options?: ComponentOptions;
}): BaseComponent<"stringSelect"> {
  return {
    id: options.id,
    type: "stringSelect",
    execute: options.execute,
    options: options.options
  };
}

export function modalComponent(options: {
  id: string;
  execute: ModalExecuteFunction;
  options?: ComponentOptions;
}): BaseComponent<"modal"> {
  return {
    id: options.id,
    type: "modal",
    execute: options.execute,
    options: options.options
  };
}

// Pattern-based component registrations
export function buttonPattern(options: {
  idPattern: RegExp;
  execute: ButtonExecuteFunction;
  options?: ComponentOptions;
}): PatternComponent<"button"> {
  return {
    id: options.idPattern.toString(),
    idPattern: options.idPattern,
    type: "button",
    execute: options.execute,
    options: options.options
  };
}

export function selectMenuPattern(options: {
  idPattern: RegExp;
  execute: StringSelectExecuteFunction;
  options?: ComponentOptions;
}): PatternComponent<"stringSelect"> {
  return {
    id: options.idPattern.toString(),
    idPattern: options.idPattern,
    type: "stringSelect",
    execute: options.execute,
    options: options.options
  };
}

export function modalPattern(options: {
  idPattern: RegExp;
  execute: ModalExecuteFunction;
  options?: ComponentOptions;
}): PatternComponent<"modal"> {
  return {
    id: options.idPattern.toString(),
    idPattern: options.idPattern,
    type: "modal",
    execute: options.execute,
    options: options.options
  };
}

// Helper for creating action rows with typed components
export function createActionRow<T extends AnyComponentBuilder>(
  ...components: T[]
): ActionRowBuilder<T> {
  return new ActionRowBuilder<T>().addComponents(...components);
}

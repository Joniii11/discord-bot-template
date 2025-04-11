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
  AnyComponentBuilder,
  Client
} from "discord.js";
import DiscordBot from "../structures/DiscordBot.js";

/**
 * Component types supported by the ComponentManager
 */
export type ComponentType = 
  | "button" 
  | "stringSelect" 
  | "userSelect"
  | "roleSelect"
  | "channelSelect"
  | "mentionableSelect"
  | "modal";

/**
 * Maps component types to their corresponding interaction types
 */
export type ComponentInteractionMap = {
  button: ButtonInteraction;
  stringSelect: StringSelectMenuInteraction;
  userSelect: UserSelectMenuInteraction;
  roleSelect: RoleSelectMenuInteraction;
  channelSelect: ChannelSelectMenuInteraction;
  mentionableSelect: MentionableSelectMenuInteraction;
  modal: ModalSubmitInteraction;
}

/**
 * Options for components
 */
export interface ComponentOptions {
  /** Cooldown in seconds */
  cooldown?: number;
  /** Category for organizing components */
  category?: string;
}

/**
 * Base component interface for exact ID matching
 */
export interface BaseComponent<T extends ComponentType = ComponentType> {
  /** Unique identifier for the component */
  id: string;
  /** Type of component */
  type: T;
  /** Optional component configuration */
  options?: ComponentOptions;
  /** Function to execute when component is interacted with */
  execute: (client: Client, interaction: ComponentInteractionMap[T]) => Promise<any>;
}

/**
 * Pattern-based component for dynamic ID matching
 */
export interface PatternComponent<T extends ComponentType = ComponentType> {
  /** Unique identifier for component registration */
  id: string;
  /** Regular expression pattern to match against customId */
  idPattern: RegExp;
  /** Type of component */
  type: T;
  /** Optional component configuration */
  options?: ComponentOptions;
  /**
   * Function to execute when component is interacted with
   * @param client - The Discord client
   * @param interaction - The interaction object
   * @param params - Parameters extracted from the customId as array
   */
  execute: (
    client: Client, 
    interaction: ComponentInteractionMap[T], 
    params: string[]
  ) => Promise<any>;
}

/**
 * Factory function for creating components with exact ID matching
 */
export function createComponent<T extends ComponentType>(
  component: BaseComponent<T>
): BaseComponent<T> {
  return component;
}

/**
 * Factory function for creating pattern-based components
 */
export function createPatternComponent<T extends ComponentType>(
  component: PatternComponent<T>
): PatternComponent<T> {
  return component;
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

// Component registration helpers
export function buttonComponent(options: {
  id: string;
  execute: (client: Client, interaction: ButtonInteraction) => Promise<any>;
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
  execute: (client: Client, interaction: StringSelectMenuInteraction) => Promise<any>;
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
  execute: (client: Client, interaction: ModalSubmitInteraction) => Promise<any>;
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
export function buttonPattern<T extends "button">(
  component: Omit<PatternComponent<T>, "type"> & { type?: T }
): PatternComponent<T> {
  return { ...component, type: "button" as T };
}

export function stringSelectPattern(
  component: Omit<PatternComponent<"stringSelect">, "type">
): PatternComponent<"stringSelect"> {
  return { ...component, type: "stringSelect" };
}

export function modalPattern(options: {
  idPattern: RegExp;
  execute: (
    client: Client, 
    interaction: ModalSubmitInteraction, 
    params: string[]
  ) => Promise<any>;
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

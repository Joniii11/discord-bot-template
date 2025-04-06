import { ClientEvents } from "discord.js";
import DiscordBot from "../structures/DiscordBot.js";
import { ClusterClientEvents } from "discord-hybrid-sharding";
// import { HarmonyLinkEvents } from "harmonylink";

/**
 * A mapping of event getter keys to their event type definitions.
 * Extend this interface to add additional event getters as needed.
 */
export interface EventTypes {
  discord: ClientEvents;
  cluster: ClusterClientEvents<DiscordBot>;
  // harmonylink: HarmonyLinkEvents;
  // Extend with additional event types:
  [key: string]: any;
}

/** Available event getter keys. */
export type AvailableEventGetters = keyof EventTypes;

/**
 * Base event file definition.
 *
 * @template K - The event getter key (e.g. "discord", "cluster", "harmonylink").
 * @template T - The specific event name, which is a key of EventTypes[K].
 */
export interface BaseEventFile<
  K extends AvailableEventGetters,
  T extends keyof EventTypes[K]
> {
  /** The name of the event. */
  name: T;
  /** If true, the event will be handled only once. */
  once?: boolean;
  /** The event getter key (e.g. "discord", "cluster", "harmonylink"). */
  eventGetter: K;
  /**
   * The event handler.
   * @param client - The DiscordBot client instance.
   * @param args - The event arguments.
   */
  execute: (client: DiscordBot, ...args: EventTypes[K][T]) => void;
}

/**
 * Specialized event file for Discord events.
 */
export interface ClientEventFile<T extends keyof ClientEvents>
  extends BaseEventFile<"discord", T> {
  execute: (client: DiscordBot, ...args: ClientEvents[T]) => Promise<unknown> | unknown;
}

/** Wrapper for an imported event file. */
export interface ImportedEventFile {
  data: BaseEventFile<AvailableEventGetters, any>;
}

/**
 * Configuration for an event managed by the event system.
 * The "callbacks" array holds one or more event handler functions.
 */
export interface EventConfiguration {
  // callbacks: ((...args: any[]) => any | Promise<any>)[];
  once?: boolean;
  eventGetter: AvailableEventGetters;
  function: ((client: DiscordBot, ...args: any[]) => Promise<unknown> | unknown)[]
}

export function eventFile<T extends keyof EventTypes["discord"]>(
  event: {
    name: T;
    once?: boolean;
    eventGetter?: "discord";
    execute: (client: DiscordBot, ...args: EventTypes["discord"][T]) => void;
  }
): BaseEventFile<"discord", T>;

export function eventFile<
  K extends Exclude<AvailableEventGetters, "discord">,
  T extends keyof EventTypes[K]
>(
  event: {
    name: T;
    once?: boolean;
    eventGetter: K;
    execute: (client: DiscordBot, ...args: EventTypes[K][T]) => void;
  }
): BaseEventFile<K, T>;

export function eventFile<
  K extends AvailableEventGetters,
  T extends keyof EventTypes[K]
>(
  event: {
    name: T;
    once?: boolean;
    eventGetter?: K;
    execute: (client: DiscordBot, ...args: EventTypes[K][T]) => void;
  }
): BaseEventFile<K, T> {
  const eventGetter = (event.eventGetter ?? "discord") as K;
  return { ...event, eventGetter };
}
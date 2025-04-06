# Event System

The event system is designed to handle Discord events and custom events in a type-safe, organized manner. This guide explains how the event system works and how to use it effectively.

## Table of Contents

- [Overview](#overview)
- [Creating Event Handlers](#creating-event-handlers)
- [Event Registration](#event-registration)
- [Event Types](#event-types)
- [Custom Event Emitters](#custom-event-emitters)

## Overview

The event system uses a modular approach where:

1. Event handlers are defined in separate files
2. Events are automatically loaded during initialization
3. Multiple handlers can respond to the same event
4. Events can come from different sources (Discord client, cluster, or custom emitters)

## Creating Event Handlers

Event handlers are created in the `src/events/` directory, organized by source:

- `src/events/client/` - For Discord client events (message, interaction, etc.)
- `src/events/cluster/` - For sharding cluster events
- You can create additional directories for custom event sources

### Basic Event Handler

```typescript
// src/events/client/messageCreate.ts
import { eventFile } from "../../utils/types/eventTypes.js";

export const data = eventFile({
    name: "messageCreate", // The name of the event to listen for
    once: false,           // Set to true if the event should only be handled once
    
    // The event handler function
    execute: async (client, message) => {
        // Your event handling logic here
        if (message.content === "ping") {
            await message.channel.send("Pong!");
        }
    }
});
```

### One-time Event Handler

```typescript
// src/events/client/ready.ts
import { eventFile } from "../../utils/types/eventTypes.js";

export const data = eventFile({
    name: "ready",
    once: true, // This event will only be handled once

    execute: async (client) => {
        client.logger.ready(`Logged in as ${client.user.tag}!`);
    }
});
```

### Cluster Event Handler

```typescript
// src/events/cluster/ready.ts
import { eventFile } from "../../utils/types/eventTypes.js";

export const data = eventFile({
    name: "ready",
    eventGetter: "cluster", // Specify this is a cluster event

    execute: async (client, clusterClient) => {
        client.logger.ready(`Cluster ${client.cluster.id} is ready!`);
    }
});
```

## Event Registration

Events are automatically registered during the initialization of the `EventManager`. The registration process:

1. Scans the `dist/events/` directory for event handlers
2. Loads and validates each event file
3. Organizes events by name and source
4. Registers event handlers with the appropriate emitters

### How Registration Works

```typescript
private registerEvents(events?: Map<string, EventConfiguration>): void {
  for (const [name, configuration] of events ?? this.events) {
    switch (configuration.eventGetter) {
      case "discord": {
        // Register with Discord client
        if (configuration.once) {
          this.client.once(name, async (...args) => 
            await this.eventRunner(name, configuration, ...args)
          );
        } else {
          this.client.on(name, async (...args) => 
            await this.eventRunner(name, configuration, ...args)
          );
        }
        break;
      }
      case "cluster": {
        // Register with cluster client
        if (configuration.once) {
          this.client.cluster.once(name, async (...args) => 
            await this.eventRunner(name, configuration, ...args)
          );
        } else {
          this.client.cluster.on(name, async (...args) => 
            await this.eventRunner(name, configuration, ...args)
          );
        }
        break;
      }
      default: {
        // Register with custom emitter
        const emitter = (this.client as any)[configuration.eventGetter];
        if (emitter && typeof emitter.on === "function" && typeof emitter.once === "function") {
          if (configuration.once) {
            emitter.once(name, async (...args) => 
              await this.eventRunner(name, configuration, ...args)
            );
          } else {
            emitter.on(name, async (...args) => 
              await this.eventRunner(name, configuration, ...args)
            );
          }
        } else {
          this.client.logger.warn(`Unsupported event getter: ${configuration.eventGetter}`);
        }
        break;
      }
    }
  }
}
```

## Event Types

Event types are defined in `src/utils/types/eventTypes.ts`, providing type safety for event handlers:

```typescript
export interface EventTypes {
  discord: ClientEvents;          // Standard Discord.js events
  cluster: ClusterClientEvents<DiscordBot>; // Cluster events
  // Add your custom event types here
  myCustomEmitter: MyCustomEvents;
  [key: string]: any;             // Allow any string key
}

export type AvailableEventGetters = keyof EventTypes;
```

## Adding New Event Types

To add support for new event types:

1. Extend the `EventTypes` interface in `eventTypes.ts`
2. Create event handlers in appropriate directories
3. Add the emitter to your `DiscordBot` class

Example:
```typescript
// Step 1: Add to EventTypes
interface MyCustomEvents {
  customEvent: [data: CustomEventData];
}

export interface EventTypes {
  discord: ClientEvents;
  cluster: ClusterClientEvents<DiscordBot>;
  myCustomEmitter: MyCustomEvents; // Added custom emitter
  [key: string]: any;
}

// Step 2: Create event handler
// src/events/myCustomEmitter/customEvent.ts
export const data = eventFile({
    name: "customEvent",
    eventGetter: "myCustomEmitter",
    
    execute: async (client, data) => {
        console.log("Custom event received:", data);
    }
});

// Step 3: Add emitter to DiscordBot
import { EventEmitter } from 'events';

export default class DiscordBot extends Client {
  // ...existing properties
  public myCustomEmitter: EventEmitter = new EventEmitter();
  
  // ...rest of class
}
```

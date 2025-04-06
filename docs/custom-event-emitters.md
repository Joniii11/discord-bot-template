# Custom Event Emitters

This guide explains how to create and use custom event emitters with the bot's event system.

## Table of Contents

- [Introduction](#introduction)
- [Adding a Custom Event Emitter](#adding-a-custom-event-emitter)
- [Defining Custom Event Types](#defining-custom-event-types)
- [Creating Event Handlers](#creating-event-handlers)
- [Emitting Custom Events](#emitting-custom-events)
- [Complete Example](#complete-example)
- [Advanced Usage](#advanced-usage)

## Introduction

The bot's event system supports any event emitter that follows the Node.js EventEmitter pattern. This allows you to create custom event emitters for specialized functionality, such as:

- Database event notifications
- API webhooks
- Inter-service communication
- Custom bot features

## Adding a Custom Event Emitter

To add a custom event emitter:

1. Create a new EventEmitter instance in your DiscordBot class
2. Define event types in `eventTypes.ts`
3. Create event handlers

### Step 1: Add the Event Emitter

```typescript
// src/utils/structures/DiscordBot.ts
import { Client, Options, Partials } from "discord.js";
import { EventEmitter } from 'events';

export default class DiscordBot extends Client {
    // ...existing properties
    
    // Add your custom event emitter
    public databaseEvents: EventEmitter = new EventEmitter();
    
    // ...rest of class
}
```

## Defining Custom Event Types

For type safety, you need to define your event types in `src/utils/types/eventTypes.ts`.

```typescript
// src/utils/types/eventTypes.ts

// Define your custom event types
interface DatabaseEvents {
  userUpdate: [userId: string, newData: UserData];
  documentDelete: [collectionName: string, documentId: string];
  connectionChange: [status: 'connected' | 'disconnected', timestamp: number];
}

export interface EventTypes {
  discord: ClientEvents;
  cluster: ClusterClientEvents<DiscordBot>;
  // Add your custom events
  databaseEvents: DatabaseEvents;
  [key: string]: any;
}
```

## Creating Event Handlers

Create event handlers in a new directory matching your emitter name:

```typescript
// src/events/databaseEvents/userUpdate.ts
import { eventFile } from "../../utils/types/eventTypes.js";

export const data = eventFile({
    name: "userUpdate",
    eventGetter: "databaseEvents", // Match your emitter name
    
    execute: async (client, userId, newData) => {
        client.logger.info(`User ${userId} was updated with new data`);
        
        // You can access the typed parameters
        if (newData.hasVerifiedEmail) {
            // Do something with the user data
        }
    }
});
```

## Emitting Custom Events

You can now emit events from anywhere in your code:

```typescript
// Example from a database service
async function updateUserInDatabase(userId, newData) {
    // Update user in database
    await db.users.update(userId, newData);
    
    // Emit event to notify listeners
    client.databaseEvents.emit('userUpdate', userId, newData);
}
```

## Complete Example

Here's a complete example of adding a system status emitter:

1. First, add the emitter to your bot class:

```typescript
// src/utils/structures/DiscordBot.ts
import { EventEmitter } from 'events';

export default class DiscordBot extends Client {
    // ... other properties
    public systemStatus: EventEmitter = new EventEmitter();
}
```

2. Define the event types:

```typescript
// src/utils/types/eventTypes.ts
interface SystemStatusEvents {
  cpuWarning: [usagePercent: number, processInfo: ProcessInfo];
  memoryWarning: [usagePercent: number, freeMemory: number];
  serviceStatus: [serviceName: string, status: 'up' | 'down' | 'degraded'];
}

export interface EventTypes {
  discord: ClientEvents;
  cluster: ClusterClientEvents<DiscordBot>;
  systemStatus: SystemStatusEvents;
  [key: string]: any;
}
```

3. Create an event handler:

```typescript
// src/events/systemStatus/memoryWarning.ts
import { eventFile } from "../../utils/types/eventTypes.js";

export const data = eventFile({
    name: "memoryWarning",
    eventGetter: "systemStatus",
    
    execute: async (client, usagePercent, freeMemory) => {
        if (usagePercent > 90) {
            // High memory usage alert
            client.logger.warn(`CRITICAL: Memory usage at ${usagePercent}%!`);
            
            // Notify admin channel
            const adminChannel = await client.channels.fetch('ADMIN_CHANNEL_ID');
            if (adminChannel?.isTextBased()) {
                await adminChannel.send({
                    embeds: [{
                        title: '⚠️ Memory Warning',
                        description: `Memory usage is at ${usagePercent}%.\nFree memory: ${(freeMemory / 1024 / 1024).toFixed(2)} MB`,
                        color: 0xFF0000
                    }]
                });
            }
        } else {
            // Just log normal warnings
            client.logger.warn(`Memory usage at ${usagePercent}%`);
        }
    }
});
```

4. Set up a monitoring system that emits events:

```typescript
// src/utils/monitoring/memoryMonitor.ts
import os from 'os';

export function startMemoryMonitoring(client, checkInterval = 60000) {
    // Check memory usage every minute
    setInterval(() => {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const percentUsed = Math.round((usedMem / totalMem) * 100);
        
        // Emit warning events based on usage
        if (percentUsed > 70) {
            client.systemStatus.emit('memoryWarning', percentUsed, freeMem);
        }
    }, checkInterval);
}
```

## Advanced Usage

### Using TypedEventEmitter

For better type safety, you can create a typed event emitter:

```typescript
// src/utils/structures/TypedEventEmitter.ts
import { EventEmitter } from 'events';

export class TypedEventEmitter<Events extends Record<string, any[]>> extends EventEmitter {
    public on<E extends keyof Events>(event: E, listener: (...args: Events[E]) => void): this {
        return super.on(event as string, listener);
    }
    
    public once<E extends keyof Events>(event: E, listener: (...args: Events[E]) => void): this {
        return super.once(event as string, listener);
    }
    
    public emit<E extends keyof Events>(event: E, ...args: Events[E]): boolean {
        return super.emit(event as string, ...args);
    }
}

// Usage
interface MyEvents {
    hello: [name: string];
    countChange: [newCount: number, oldCount: number];
}

const emitter = new TypedEventEmitter<MyEvents>();

// Fully typed
emitter.on('hello', (name) => {
    console.log(`Hello, ${name}!`);
});

emitter.emit('hello', 'World'); // Correct
// emitter.emit('hello', 123); // Type error
// emitter.emit('nonexistent'); // Type error
```

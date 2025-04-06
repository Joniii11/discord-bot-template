# Type Safety

This document explains how type safety is implemented throughout the Discord bot framework and how to leverage TypeScript to make your code more robust.

## Table of Contents

- [Introduction](#introduction)
- [Command System Type Safety](#command-system-type-safety)
  - [Command Mode Typing](#command-mode-typing)
  - [Command Options Typing](#command-options-typing)
  - [Command Arguments](#command-arguments)
- [Component System Type Safety](#component-system-type-safety)
  - [Component Type Specialization](#component-type-specialization)
  - [Pattern Matching Components](#pattern-matching-components)
- [Event System Type Safety](#event-system-type-safety)
  - [Event Types](#event-types)
  - [Custom Event Emitters](#custom-event-emitters)
- [CommandExecutor Type Safety](#commandexecutor-type-safety)
  - [Method Overloads](#method-overloads)
  - [Type Guards](#type-guards)
- [Advanced Types](#advanced-types)
  - [Conditional Types](#conditional-types)
  - [Template Literal Types](#template-literal-types)
- [Best Practices](#best-practices)

## Introduction

The Discord bot framework uses TypeScript's advanced type system to provide compile-time safety and excellent IDE support. This helps catch errors early, provides better autocomplete suggestions, and makes the code more maintainable.

## Command System Type Safety

### Command Mode Typing

Commands can operate in different modes: slash command only, message command only, or both. The framework provides type safety for each mode:

```typescript
// Slash command only - cmdExecutor is typed as CommandExecutor<"interaction">
export const data = commandFile({
    // ...configuration
    options: {
        slashOnly: true
    },
    execute: async (cmdExecutor) => {
        // TypeScript knows this is a slash command
        const option = cmdExecutor.interaction.options.getString("option");
    }
});

// Message command only - cmdExecutor is typed as CommandExecutor<"message">
export const data = commandFile({
    // ...configuration
    options: {
        messageOnly: true
    },
    execute: async (cmdExecutor) => {
        // TypeScript knows this is a message command
        const arg = cmdExecutor.arguments[0];
    }
});
```

### Command Options Typing

The options object is also type-checked based on the command mode:

```typescript
// TypeScript will error if you try to include aliases with slashOnly: true
export const data = commandFile({
    // ...configuration
    options: {
        slashOnly: true,
        aliases: ["alias1"] // Error: Property 'aliases' does not exist on type 'OptionsSlash'
    }
});
```

### Command Arguments

For slash commands, arguments are defined and type-checked through the SlashCommandBuilder:

```typescript
new SlashCommandBuilder()
    .setName("user")
    .addUserOption(option => 
        option.setName("target")
        .setDescription("The user")
        .setRequired(true)
    )

// Later in your code:
const user = interaction.options.getUser("target", true); // Typed as User, not null
```

## Component System Type Safety

### Component Type Specialization

Each component type (button, select menu, modal) has its own specialized interface and helper function:

```typescript
// Button component
export const data = buttonComponent({
    id: "my_button",
    execute: async (client, interaction: ButtonInteraction) => {
        // interaction is typed as ButtonInteraction
    }
});

// String select menu component
export const data = stringSelectComponent({
    id: "my_select",
    execute: async (client, interaction: StringSelectMenuInteraction) => {
        // interaction is typed as StringSelectMenuInteraction
        const values = interaction.values; // Typed as string[]
    }
});

// User select menu component
export const data = userSelectComponent({
    id: "user_select",
    execute: async (client, interaction: UserSelectMenuInteraction) => {
        // interaction is typed as UserSelectMenuInteraction
        const users = interaction.values; // Typed as string[] (user IDs)
    }
});
```

### Pattern Matching Components

For pattern-based components, TypeScript still ensures type safety:

```typescript
export const data = buttonPattern({
    idPattern: /^page_(\d+)_of_(\d+)$/,
    execute: async (client, interaction: ButtonInteraction) => {
        // Still properly typed as ButtonInteraction
        const matches = interaction.customId.match(/^page_(\d+)_of_(\d+)$/);
        const pageNum = matches ? parseInt(matches[1]) : 1;
    }
});
```

## Event System Type Safety

### Event Types

Events are typed based on their source (Discord client, cluster, etc.):

```typescript
// Discord client event
export const data = eventFile({
    name: "messageCreate", // This must be a valid Discord.js event name
    execute: async (client, message) => {
        // message is typed as Message<boolean>
    }
});

// Cluster event
export const data = eventFile({
    name: "ready",
    eventGetter: "cluster",
    execute: async (client, cluster) => {
        // cluster is typed correctly from discord-hybrid-sharding
    }
});
```

### Custom Event Emitters

For custom event emitters, you can extend the EventTypes interface:

```typescript
// Add to eventTypes.ts
interface DatabaseEvents {
  userUpdate: [userId: string, updatedData: UserData];
}

export interface EventTypes {
  discord: ClientEvents;
  cluster: ClusterClientEvents<DiscordBot>;
  database: DatabaseEvents;
  [key: string]: any;
}

// Then in your event handler
export const data = eventFile({
    name: "userUpdate",
    eventGetter: "database",
    execute: async (client, userId, updatedData) => {
        // userId and updatedData are correctly typed
        if (updatedData.premium) {
            // Handle premium user update
        }
    }
});
```

## CommandExecutor Type Safety

The `CommandExecutor` class provides a unified interface for both slash commands and message commands with strong typing.

### Method Overloads

Methods are overloaded to provide proper typing depending on the command mode:

```typescript
// From CommandExecutor.ts
public reply(
    this: CommandExecutor<"interaction">,
    options: T extends "interaction" ? InteractionReplyOptions : never
): T extends "interaction" ? Promise<InteractionResponse> : never;

public reply(
    this: CommandExecutor<"message">,
    options: T extends "message" ? string | MessagePayload | MessageReplyOptions : never
): T extends "message" ? Promise<Message> : never;
```

### Type Guards

Type guard methods ensure proper runtime type checking:

```typescript
execute: async (cmdExecutor) => {
    if (cmdExecutor.isInteraction()) {
        // TypeScript knows cmdExecutor has interaction properties
        const option = cmdExecutor.interaction.options.getString("option");
    } else if (cmdExecutor.isMessage()) {
        // TypeScript knows cmdExecutor has message properties
        const arg = cmdExecutor.arguments[0];
    }
}
```

## Advanced Types

### Conditional Types

The framework uses conditional types to provide specialized behavior:

```typescript
// Example from commandManager.ts
export function commandFile<
  T extends Partial<CommandOptions> & (SlashOnlyOptions | MessageOnlyOptions | BothOptions)
>(
  command: {
    // ...
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
): BaseCommand<...>
```

### Template Literal Types

Template literal types can be used for pattern matching:

```typescript
// Example for custom ID patterns
type PaginationButtonId = `page_${number}_of_${number}`;

// Usage
function isPaginationButton(id: string): id is PaginationButtonId {
    return /^page_\d+_of_\d+$/.test(id);
}
```

## Best Practices

1. **Use Type Annotations Sparingly**: TypeScript can infer most types. Add annotations only when necessary.

```typescript
// Good - Let TypeScript infer the type
const user = interaction.options.getUser("target", true);

// Less Good - Unnecessary annotation
const user: User = interaction.options.getUser("target", true);
```

2. **Enable Strict Mode**: Always use TypeScript's strict mode for maximum type safety.

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    // other options...
  }
}
```

3. **Use Non-Null Assertion Only When Certain**: The non-null assertion operator (`!`) should be used sparingly.

```typescript
// Good - Use optional chaining and nullish coalescing
const guildName = guild?.name ?? "Unknown Guild";

// Less Good - Using non-null assertion
const guildName = guild!.name;
```

4. **Leverage Type Guards**: Create custom type guards for complex type checking.

```typescript
function isAdminUser(user: User): user is User & { isAdmin: true } {
    return adminUserIds.includes(user.id);
}

if (isAdminUser(user)) {
    // TypeScript knows user has isAdmin property
}
```

5. **Use Readonly When Applicable**: For data that shouldn't change, use readonly.

```typescript
interface CommandConfig {
    readonly name: string;
    readonly description: string;
    readonly options: readonly CommandOptionConfig[];
}
```

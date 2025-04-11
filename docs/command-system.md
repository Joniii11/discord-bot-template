# Command System

The command system provides a unified way to handle both slash commands and traditional message-based commands with type safety and automatic command registration.

## Table of Contents

- [Overview](#overview)
- [Creating Commands](#creating-commands)
  - [Basic Command](#basic-command)
  - [Slash-Only Command](#slash-only-command)
  - [Message-Only Command](#message-only-command)
  - [Commands with Arguments](#commands-with-arguments)
  - [Commands with Subcommands](#commands-with-subcommands)
- [Command Options](#command-options)
- [Command Execution](#command-execution)
- [Unified Argument Handling](#unified-argument-handling)
- [Command Cooldowns](#command-cooldowns)
- [Permissions](#permissions)
- [Type Safety](#type-safety)

## Overview

The command system features:

- Unified handling of both slash commands and message commands
- Built-in cooldown management
- Command categories for organization
- Command aliases for message commands
- Automatic command registration with Discord
- Type-safe command arguments and responses

## Creating Commands

Commands are created in the `src/commands/` directory, organized by category folders. Each command is a separate file that exports a command definition.

### Basic Command

A command that works with both slash commands and message prefixes:

```typescript
// src/commands/Utility/ping.ts
import { SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";

export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check the bot's latency"),
    
    options: {
        cooldown: 5,
        aliases: ["latency"],
        category: "Utility"
    },
    
    execute: async (cmdExecutor) => {
        const startTime = Date.now();
        const msg = await cmdExecutor.reply("Pinging...");
        const endTime = Date.now();
        
        const ping = endTime - startTime;
        const apiPing = cmdExecutor.client.ws.ping;
        const response = `Pong! 🏓\nBot Latency: ${ping}ms\nAPI Latency: ${apiPing}ms`;
        
        // withMode option
        await cmdExecutor.withMode({
            interaction: (exec) => exec.editReply(response),
            message: (exec) => exec.editReply(msg, response)
        });
        
        // Alternatively, you can use type guards
        // if (cmdExecutor.isInteraction()) {
        //     await cmdExecutor.editReply(response);
        // } else {
        //     await cmdExecutor.editReply(msg, response);
        // }
    }
});
```

### Slash-Only Command

A command that only works with slash commands:

```typescript
// src/commands/Admin/ban.ts
import { SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";

export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban a user from the server")
        .addUserOption(option => 
            option.setName("user")
                .setDescription("The user to ban")
                .setRequired(true))
        .addStringOption(option => 
            option.setName("reason")
                .setDescription("The reason for the ban")),
    
    options: {
        slashOnly: true,  // Only available as a slash command
        cooldown: 10,
    },
    
    execute: async (cmdExecutor) => {
        // With slashOnly: true, cmdExecutor is typed as CommandExecutor<"slash">
        const user = cmdExecutor.interaction.options.getUser("user", true);
        const reason = cmdExecutor.interaction.options.getString("reason") || "No reason provided";
        
        // Ban logic here...
        
        await cmdExecutor.reply(`Banned ${user.tag} for reason: ${reason}`);
    }
});
```

### Message-Only Command

A command that only works with message prefix:

```typescript
// src/commands/Fun/quote.ts
import { SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";

export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("quote")
        .setDescription("Quote a message by ID"),
    
    options: {
        messageOnly: true,  // Only available with message prefix
        aliases: ["q"],
    },
    
    execute: async (cmdExecutor) => {
        // With messageOnly: true, cmdExecutor is typed as CommandExecutor<"message">
        const messageId = cmdExecutor.arguments[0];
        if (!messageId) {
            return cmdExecutor.reply("Please provide a message ID to quote.");
        }
        
        // Quote logic here...
        
        await cmdExecutor.reply(`Quoting message ${messageId}`);
    }
});
```

### Commands with Arguments

For slash commands and message commands, you should use the unified argument methods for consistent handling:

```typescript
// src/commands/Utility/userinfo.ts
import { SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";

export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("Get information about a user")
        .addUserOption(option => 
            option.setName("user")
                .setDescription("The user to get info about")
                .setRequired(false)),
    
    execute: async (cmdExecutor) => {
        // Use the unified method - works for both slash and message commands
        const user = cmdExecutor.getUser("user") || cmdExecutor.getAuthor;
        
        // Create and send user info embed
        await cmdExecutor.reply({
            embeds: [{
                title: `User Info: ${user.tag}`,
                thumbnail: { url: user.displayAvatarURL({ size: 256 }) },
                fields: [
                    { name: 'ID', value: user.id, inline: true },
                    { name: 'Created', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`, inline: true },
                ],
                color: 0x3498db
            }]
        });
    }
});
```

### Commands with Subcommands

For more complex commands, you can use subcommands:

```typescript
// src/commands/Admin/config.ts
import { SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";

export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("config")
        .setDescription("Configure bot settings")
        .addSubcommand(subcommand =>
            subcommand
                .setName("view")
                .setDescription("View current configuration"))
        .addSubcommand(subcommand =>
            subcommand
                .setName("set")
                .setDescription("Set a configuration value")
                .addStringOption(option =>
                    option.setName("key")
                        .setDescription("The configuration key")
                        .setRequired(true)
                        .addChoices(
                            { name: 'Welcome Channel', value: 'welcomeChannel' },
                            { name: 'Prefix', value: 'prefix' },
                            { name: 'Log Level', value: 'logLevel' }
                        ))
                .addStringOption(option =>
                    option.setName("value")
                        .setDescription("The value to set")
                        .setRequired(true))),
    
    options: {
        slashOnly: true,
    },
    
    execute: async (cmdExecutor) => {
        const subcommand = cmdExecutor.interaction.options.getSubcommand();
        
        if (subcommand === "view") {
            // Handle view subcommand
            await cmdExecutor.reply("Here's the current configuration...");
        } else if (subcommand === "set") {
            const key = cmdExecutor.interaction.options.getString("key", true);
            const value = cmdExecutor.interaction.options.getString("value", true);
            
            // Handle set subcommand
            await cmdExecutor.reply(`Setting ${key} to ${value}...`);
        }
    }
});
```

## Command Options

Commands can have various options:

```typescript
options: {
    // Command category (defaults to folder name)
    category: "Admin",
    
    // Cooldown in seconds (0 = no cooldown)
    cooldown: 5,
    
    // Aliases for message commands (ignored for slash-only commands)
    aliases: ["a", "alias1", "alias2"],
    
    // Command mode options (choose one)
    slashOnly: true,  // Only available as a slash command
    messageOnly: true, // Only available as a message command
    
    // Permission settings
    permissions: {
        // Permissions the bot needs to execute the command
        botPermissions: ["KickMembers", "BanMembers"],
        
        // Permissions the user needs to execute the command
        userPermissions: ["KickMembers"],
        
        // If true, only the bot owner can use this command
        ownerOnly: false,
        
        // If true, command can only be used in servers
        guildOnly: true,
        
        // If true, command can only be used in DMs
        dmOnly: false,
        
        // Specific role IDs that can use this command
        roleIds: ["123456789012345678"]
    },
    
    // Custom permission check function (optional)
    permissionCheck?: async (cmdExecutor) => {
        // Custom permission logic
        return { 
            allowed: true, 
            reason: "Permission denied message if allowed is false" 
        };
    }
}
```

## Command Execution

The `execute` function receives a `CommandExecutor` object that provides a unified interface for both slash commands and message commands:

```typescript
execute: async (cmdExecutor) => {
    // Check the execution mode
    if (cmdExecutor.isInteraction()) {
        // Slash command specific logic
        const option = cmdExecutor.interaction.options.getString("option");
    } else if (cmdExecutor.isMessage()) {
        // Message command specific logic
        const arg = cmdExecutor.arguments[0];
    }
    
    // Common logic that works for both
    await cmdExecutor.reply("This works in both modes!");
    
    // Defer, edit, follow up, etc.
    await cmdExecutor.deferReply();
    await cmdExecutor.editReply("Updated message");
    await cmdExecutor.followUp("Follow-up message");
}
```

## Unified Argument Handling

The `CommandExecutor` provides unified methods to access arguments in a consistent way for both slash commands and message commands:

```typescript
execute: async (cmdExecutor) => {
    // These methods work for both slash commands and message commands
    const name = cmdExecutor.getString("name");           // Get a string argument
    const user = cmdExecutor.getUser("user");             // Get a user argument
    const amount = cmdExecutor.getNumber("amount");       // Get a number argument
    const enabled = cmdExecutor.getBoolean("enabled");    // Get a boolean argument
    const channel = cmdExecutor.getChannel("channel");    // Get a channel argument
    const role = cmdExecutor.getRole("role");             // Get a role argument
    const mentionable = cmdExecutor.getMentionable("mention"); // Get a user or role
    const attachment = cmdExecutor.getAttachment("file"); // Get an attachment (slash only)
    const integer = cmdExecutor.getInteger("count");      // Get an integer
    
    // You can specify if an argument is required with generic type parameters
    const requiredUser = cmdExecutor.getUser("user", true);  // Will throw error if missing
    
    // For message commands, these methods use the parsed arguments
    // For slash commands, they use the Discord.js interaction options
    
    // Full access to all command options as an object
    const allOptions = cmdExecutor.getOptions();
    
    // Helper methods for context
    const member = cmdExecutor.getMember();  // GuildMember object for the command executor
    const guild = cmdExecutor.getGuild();    // The guild where the command was executed
    }
```

The unified argument methods provide better type safety and consistent error handling:

- For slash commands, they use Discord.js's built-in option methods
- For message commands, they use the argument parser that converts arguments to the right types
- They support type generics and required flags for better TypeScript support

This means you can write command logic once that works for both slash commands and message commands without dealing with the internal differences.

## Command Cooldowns

Cooldowns are managed automatically through the `CooldownManager`:

```typescript
// src/commands/Economy/daily.ts
export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("daily")
        .setDescription("Claim your daily reward"),
    
    options: {
        cooldown: 86400, // 24 hours in seconds
    },
    
    execute: async (cmdExecutor) => {
        // This command can only be used once every 24 hours per user
        
        // Give reward...
        
        await cmdExecutor.reply("You've claimed your daily reward!");
    }
});
```

If a user tries to use the command before the cooldown expires, they'll automatically receive a cooldown message.

## Permissions

The command system provides a comprehensive permissions system that controls who can execute commands. It supports both standard Discord permissions and custom permission logic.

### Permission Types

The permission system includes several ways to control access:

1. **Discord Permissions**: Standard Discord permission flags for both users and the bot
2. **Command Restriction Flags**: 
   - `guildOnly`: Commands that can only be used in servers, not DMs
   - `dmOnly`: Commands that can only be used in DMs, not servers
   - `ownerOnly`: Commands that can only be used by the bot owner
3. **Role-Based Access**: Restrict commands to users with specific role IDs
4. **Custom Permission Checks**: Custom functions that implement complex permission logic

### Setting Up Permissions

You can define permissions in the command options:

```typescript
// src/commands/Admin/kick.ts
import { SlashCommandBuilder, PermissionFlagsBits } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";

export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Kick a user from the server")
        .addUserOption(option => 
            option.setName("user")
                .setDescription("The user to kick")
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    
    options: {
        // Standard permission requirements
        permissions: {
            // Permissions the bot needs to execute the command
            botPermissions: ["KickMembers"],
            
            // Permissions the user needs to execute the command
            userPermissions: ["KickMembers"],
            
            // Restriction flags
            guildOnly: true,
            ownerOnly: false,
            
            // Role IDs that can use this command
            roleIds: ["123456789012345678", "987654321098765432"]
        }
    },
    
    execute: async (cmdExecutor) => {
        // Command implementation...
    }
});
```

### Custom Permission Checks

For more complex permission logic, you can implement a custom permission check function:

```typescript
// src/commands/Moderation/warn.ts
export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Warn a user"),
    
    options: {
        // Custom permission check function
        permissionCheck: async (cmdExecutor) => {
            // Get the member executing the command
            const member = cmdExecutor.getMember();
            if (!member) return { 
                allowed: false, 
                reason: "This command can only be used in a server." 
            };
            
            // Check if user is a moderator (custom role check)
            const isModerator = member.roles.cache.some(role => 
                role.name.toLowerCase().includes("moderator") || 
                role.name.toLowerCase().includes("admin")
            );
            
            // Check server-specific permission in database (example)
            let hasServerPermission = false;
            
            if (cmdExecutor.getGuild()) {
                try {
                    // This is just an example of how you could check permissions from a database
                    const guildId = cmdExecutor.getGuild().id;
                    const userId = cmdExecutor.getAuthor.id;
                    
                    // hasServerPermission = await db.checkModPermission(guildId, userId);
                    
                } catch (error) {
                    // Handle errors
                }
            }
            
            // Return the permission check result
            return {
                allowed: isModerator || hasServerPermission,
                reason: "You must be a moderator or have warning permissions to use this command."
            };
        }
    },
    
    execute: async (cmdExecutor) => {
        // Command implementation...
    }
});
```

### Permission Check Order

When a command is executed, permissions are checked in this order:

1. First, the **custom permission check** is evaluated if defined. If it returns `{allowed: false}`, the command is denied regardless of other permissions.

2. Then, if the custom check passes or isn't defined, the **standard permissions** are checked:
   - Owner-only restriction
   - Guild-only or DM-only restrictions
   - Role-based permissions
   - Discord user permissions
   - Discord bot permissions

If any permission check fails, the command execution is stopped and an error message is sent to the user.

### Permission Error Handling

When a user doesn't have permission to use a command, they receive a permission denied message with the reason:

```typescript
// The reason comes from either:
// - The custom permission check's reason field
// - A standard message for built-in permission checks
```

You can customize the appearance of permission denied messages by modifying the `permissionDeniedEmbed` function in your embeds.

### Using Permissions in Command Logic

Beyond the automatic permission checks, you can also perform additional permission checks during command execution:

```typescript
execute: async (cmdExecutor) => {
    const targetUser = cmdExecutor.getUser("user", true);
    const guild = cmdExecutor.getGuild();
    
    if (!guild) {
        return cmdExecutor.reply("This command must be used in a server.");
    }
    
    const member = cmdExecutor.getMember();
    const targetMember = await guild.members.fetch(targetUser.id);
    
    // Check role hierarchy (can't moderate users with higher roles)
    if (targetMember.roles.highest.position >= member.roles.highest.position) {
        return cmdExecutor.reply({
            content: "You cannot moderate members with a higher or equal role.",
            ephemeral: true
        });
    }
    
    // Continue command execution...
}
```

## Type Safety

The command system provides extensive type safety:

- For slash-only commands, `cmdExecutor` is typed as `CommandExecutor<"slash">`
- For message-only commands, `cmdExecutor` is typed as `CommandExecutor<"message">`
- For dual-mode commands, you get full type checking when using `isInteraction()` or `isMessage()`

This ensures you can't accidentally access slash command properties in message commands or vice versa:

```typescript
// This will cause a TypeScript error if slashOnly: true isn't set
const option = cmdExecutor.interaction.options.getString("option");

// This will cause a TypeScript error if messageOnly: true isn't set
const argument = cmdExecutor.arguments[0];
```

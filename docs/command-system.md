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

For slash commands, arguments are defined using the Discord.js SlashCommandBuilder:

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
        let user;
        
        if (cmdExecutor.isInteraction()) {
            // For slash commands, get the option
            user = cmdExecutor.interaction.options.getUser("user") || cmdExecutor.interaction.user;
        } else {
            // For message commands, parse the argument
            const mentionId = cmdExecutor.arguments[0]?.match(/^<@!?(\d+)>$/)?.[1];
            user = mentionId 
                ? await cmdExecutor.client.users.fetch(mentionId).catch(() => cmdExecutor.message.author)
                : cmdExecutor.message.author;
        }
        
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
    
    // If true, command is ONLY available as slash command
    slashOnly: true,
    
    // If true, command is ONLY available as message command
    messageOnly: true,
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

Commands can have permission requirements that are checked before execution. The permission system provides several ways to control who can use each command.

### Setting Command Permissions

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
        // Discord permission requirements
        permissions: {
            // Permissions the bot needs to execute the command
            bot: ["KickMembers"],
            // Permissions the user needs to execute the command
            user: ["KickMembers"]
        },
        // Custom permission check function
        permissionCheck: async (cmdExecutor) => {
            // Custom logic to determine if the user can use this command
            const member = cmdExecutor.getMember();
            if (!member) return { allowed: false, reason: "This command can only be used in a server." };
            
            // Check if user is a moderator (custom role check)
            const isModerator = member.roles.cache.some(role => 
                role.name.toLowerCase().includes("moderator")
            );
            
            return {
                allowed: isModerator,
                reason: isModerator ? "" : "You must be a moderator to use this command."
            };
        }
    },
    
    execute: async (cmdExecutor) => {
        const user = cmdExecutor.getUser("user", true);
        await cmdExecutor.reply(`Kicking ${user.tag}...`);
        
        // Kick logic here...
    }
});
```

### Permission Types

The system supports several types of permission checks:

1. **Discord Permissions**: Standard Discord permission flags
2. **Guild-Only**: Commands that can only be used in servers, not DMs
3. **Owner-Only**: Commands that can only be used by the bot owner
4. **Custom Permission Checks**: Functions that implement custom logic

### Guild-Only and Owner-Only Commands

You can restrict commands to guild channels or the bot owner:

```typescript
// src/commands/Owner/eval.ts
export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("eval")
        .setDescription("Evaluate JavaScript code"),
    
    options: {
        // Only bot owner can use this command
        ownerOnly: true
    },
    
    execute: async (cmdExecutor) => {
        // Dangerous eval command logic here...
    }
});

// src/commands/Server/serverinfo.ts
export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription("Get information about this server"),
    
    options: {
        // Can only be used in a guild, not in DMs
        guildOnly: true
    },
    
    execute: async (cmdExecutor) => {
        // This is guaranteed to be in a guild context
        const guild = cmdExecutor.getGuild();
        
        await cmdExecutor.reply(`Server info for ${guild.name}...`);
    }
});
```

### Permission Error Handling

When a user doesn't have permission to use a command, the system automatically sends an appropriate error message:

```typescript
// Automatic error messages are sent when:
// - The command is owner-only and used by a non-owner
// - The command is guild-only and used in DMs
// - The user lacks required Discord permissions
// - The bot lacks required Discord permissions
// - The custom permission check returns {allowed: false}
```

You can customize these error messages in your bot configuration.

### Using Permissions in Command Logic

You can also check permissions during command execution:

```typescript
execute: async (cmdExecutor) => {
    const user = cmdExecutor.getUser("user", true);
    const targetMember = await cmdExecutor.getGuild().members.fetch(user.id);
    
    // Check if command user can manage this specific member
    if (!cmdExecutor.getMember().permissions.has(PermissionFlagsBits.Administrator) && 
        targetMember.roles.highest.position >= cmdExecutor.getMember().roles.highest.position) {
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

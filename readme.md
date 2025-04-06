# Discord Bot Template

A powerful, TypeScript-based Discord bot template using the latest Discord.js v14 with built-in sharding support, command management, and more.

![Discord.js Version](https://img.shields.io/badge/discord.js-v14.18.0-blue)
![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)

## ✨ Features

- **Modular Architecture** - Clean, maintainable code structure
- **TypeScript** - Type-safe development experience
- **Discord.js v14** - Latest Discord API support
- **ESM Modules** - Modern JavaScript module system
- **Sharding Support** - Built-in clustering via discord-hybrid-sharding
- **Command System**
  - Slash commands with automatic registration
  - Traditional prefix commands
  - Command cooldowns
  - Command categories
  - Command aliases
- **Event System** - Type-safe event handling
- **Logging** - Beautiful console logging with colors
- **Configuration** - Easy setup via environment variables

## 📋 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- npm or yarn

### Installation

1. Clone this repository
```bash
git clone https://github.com/Joniii11/discord-bot-template.git
cd discord-bot-template
```

2. Install dependencies
```bash
npm install
```

3. Create a `.env` file based on the `.env.example`
```bash
cp .env.example .env
```

4. Edit the `.env` file with your Discord bot token and settings
```
USE_SHARDING = true
TOKEN = "your-bot-token"
SHOW_DEBUG = true
PREFIX = -
```

5. Build and run the bot
```bash
npm run build
npm start
```

## 📁 Project Structure

```
discord-bot/
├── src/                  # Source code
│   ├── commands/         # Bot commands organized by category
│   ├── events/           # Event handlers
│   │   ├── client/       # Discord.js client events
│   │   └── cluster/      # Sharding cluster events
│   ├── utils/
│   │   ├── classes/      # Utility classes
│   │   ├── embeds/       # Discord embed templates
│   │   ├── managers/     # System managers
│   │   ├── structures/   # Core structures
│   │   └── types/        # TypeScript type definitions
│   ├── Bot.ts            # Bot initialization
│   └── index.ts          # Entry point with sharding setup
└── dist/                 # Compiled JavaScript
```

## 💻 Creating Commands

Create a new file in `src/commands/[Category]/` with the following structure:

```typescript
import { SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";

export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("command-name")
        .setDescription("Command description"),
    
    options: {
        cooldown: 5,         // Cooldown in seconds
        aliases: ["alias1"],  // Command aliases for prefix commands
    },

    execute: async (cmdExecutor) => {
        await cmdExecutor.reply("Your command response!");
    }
});
```

## 🔄 Event Handling

Create a new file in `src/events/client/` or `src/events/cluster/` with the following structure:

```typescript
import { eventFile } from "../../utils/types/eventTypes.js";

export const data = eventFile({
    name: "eventName", // e.g., "messageCreate", "ready"
    once: false,       // Set to true for one-time events

    execute: async (client, ...eventArgs) => {
        // Your event handling logic
    }
});
```

## 🚀 Planned Features

- **Components System** - Simplified handling of buttons, select menus, and modals
- **Enhanced Type Safety** - More robust type checking throughout the codebase
- **More utility functions** - Common helper functions for typical bot tasks
- **Improved documentation** - Comprehensive guides and examples

## 📚 Advanced Usage

### Command Executor

The template provides a unified `CommandExecutor` class that handles both slash commands and traditional message commands:

```typescript
execute: async (cmdExecutor) => {
    // Check if interaction or message command
    if (cmdExecutor.isInteraction()) {
        // Slash command logic
    } else if (cmdExecutor.isMessage()) {
        // Message command logic
    }
    
    // Common logic for both types
    await cmdExecutor.reply("Response works for both types!");
}
```

### Cooldowns

Cooldowns are automatically managed through the `CooldownManager` class:

```typescript
options: {
    cooldown: 10, // 10 seconds cooldown
}
```

## 🔧 Configuration

The bot can be configured through environment variables in the `.env` file:

- `TOKEN` - Your Discord bot token
- `USE_SHARDING` - Enable/disable sharding support
- `SHOW_DEBUG` - Show debug logs
- `PREFIX` - Command prefix for traditional commands

## 📜 License

ISC

## 👨‍💻 Author

[Joniii (https://github.com/Joniii11)](https://github.com/Joniii11)

---

Made with ❤️ using Discord.js and TypeScript
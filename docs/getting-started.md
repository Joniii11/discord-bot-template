# Getting Started

This guide will help you set up and start developing with the Discord bot framework.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Bot](#running-the-bot)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Next Steps](#next-steps)

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (usually comes with Node.js)
- A code editor (Visual Studio Code recommended for TypeScript support)
- Git (optional, for version control)

You'll also need:

- A Discord account
- A Discord application and bot token (created through the [Discord Developer Portal](https://discord.com/developers/applications))
- Appropriate permissions and a server to test your bot

## Installation

1. **Clone the repository:**

```bash
git clone https://github.com/Joniii11/discord-bot-template.git
cd discord-bot-template
```

2. **Install dependencies:**

```bash
npm install
```

3. **Create environment file:**

Copy the example environment file to create your own:

```bash
cp .env.example .env
```

## Configuration

Edit the `.env` file with your Discord bot token and other settings:

```
# Whether to use Sharding or not
USE_SHARDING = true

# The token for your bot (from Discord Developer Portal)
TOKEN = "your-token-goes-here"

# Whether to show debug information in the console
SHOW_DEBUG = true

# The prefix for traditional message commands
PREFIX = -
```

### Bot Permissions

When adding your bot to a server, make sure it has the necessary permissions:

- **Send Messages** - Basic message sending
- **Embed Links** - For rich embeds
- **Use Slash Commands** - For slash commands
- Other permissions depending on your bot's functionality

The recommended invite URL format is:

```
https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=PERMISSION_INTEGER&scope=bot%20applications.commands
```

You can use the [Discord Permission Calculator](https://discordapi.com/permissions.html) to determine the correct permission integer.

## Running the Bot

### Development Mode

For development with automatic reloading:

```bash
npm run dev
```

### Production Mode

To build and start the bot for production:

```bash
npm run build
npm start
```

## Development Workflow

### Creating a Command

1. Create a new file in the appropriate category folder in `src/commands/`:

```typescript
// src/commands/Utility/example.ts
import { SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";

export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("example")
        .setDescription("An example command"),
    
    options: {
        cooldown: 5,
    },
    
    execute: async (cmdExecutor) => {
        await cmdExecutor.reply("This is an example command!");
    }
});
```

2. The command will be automatically loaded and registered on bot startup.

### Creating a Component Handler

1. Create a new file in `src/components/`:

```typescript
// src/components/Buttons/exampleButton.ts
import { ButtonInteraction } from "discord.js";
import { buttonComponent } from "../../utils/types/componentManager.js";

export const data = buttonComponent({
    id: "example_button",
    
    execute: async (client, interaction: ButtonInteraction) => {
        await interaction.reply({
            content: "You clicked the example button!",
            ephemeral: true
        });
    }
});
```

2. The component handler will be automatically loaded on bot startup.

### Creating an Event Handler

1. Create a new file in the appropriate folder in `src/events/`:

```typescript
// src/events/client/guildCreate.ts
import { eventFile } from "../../utils/types/eventTypes.js";

export const data = eventFile({
    name: "guildCreate",
    
    execute: async (client, guild) => {
        client.logger.info(`Bot joined a new server: ${guild.name} (ID: ${guild.id})`);
    }
});
```

2. The event handler will be automatically loaded on bot startup.

## Project Structure

The project follows a modular structure:

```
discord-bot/
├── src/
│   ├── commands/        # Bot commands by category
│   ├── components/      # UI component handlers
│   ├── events/          # Event handlers
│   ├── utils/           # Utilities and core systems
│   ├── Bot.ts           # Bot initialization
│   └── index.ts         # Entry point
└── dist/                # Compiled JavaScript
```

For more details, see the [Project Structure](./project-structure.md) documentation.

## Next Steps

Once you have the bot running, here are some ways to continue development:

1. **Explore the Documentation:**
   - [Command System](./command-system.md)
   - [Component System](./component-system.md)
   - [Event System](./event-system.md)
   - [Custom Event Emitters](./custom-event-emitters.md)

2. **Add Features:**
   - Create commands for your specific needs
   - Implement interactive components
   - Add custom event handlers

3. **Learn About Discord.js:**
   - [Discord.js Guide](https://discordjs.guide/)
   - [Discord.js Documentation](https://discord.js.org/)

4. **Connect External Services:**
   - Add a database for persistent storage
   - Integrate with APIs for additional functionality
   - Implement a web dashboard

5. **Deploy Your Bot:**
   - Set up hosting on a VPS, Heroku, or other service
   - Configure for production environment
   - Set up monitoring and logging

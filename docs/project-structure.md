# Project Structure

This document explains the project structure of the Discord bot, including the purpose of each directory and file.

## Directory Structure

```
discord-bot/
├── docs/                  # Documentation
├── src/                   # Source code
│   ├── commands/          # Bot commands
│   │   ├── Admin/         # Admin commands
│   │   ├── Information/   # Information commands
│   │   ├── Utility/       # Utility commands
│   │   └── ...            # Other command categories
│   ├── components/        # UI component handlers
│   │   ├── Buttons/       # Button interaction handlers
│   │   ├── Forms/         # Modal form handlers
│   │   └── Menus/         # Select menu handlers
│   ├── events/            # Event handlers
│   │   ├── client/        # Discord client events
│   │   └── cluster/       # Sharding cluster events
│   ├── utils/             # Utility code
│   │   ├── classes/       # Utility classes
│   │   ├── embeds/        # Discord embed templates
│   │   ├── managers/      # System managers
│   │   ├── structures/    # Core structures
│   │   └── types/         # TypeScript type definitions
│   ├── Bot.ts             # Bot initialization
│   └── index.ts           # Entry point with sharding setup
└── dist/                  # Compiled JavaScript
```

## Key Files and Directories

### Root Files

- `package.json` - Project configuration and dependencies
- `tsconfig.json` - TypeScript configuration
- `.env` - Environment variables (not in git)
- `.env.example` - Example environment variables
- `README.md` - Project overview and setup instructions

### Source Code Organization

#### Commands (`src/commands/`)

Commands are organized by category folders. Each command is a single file that exports a command definition:

```
src/commands/
├── Admin/                 # Administrative commands
│   ├── ban.ts
│   ├── kick.ts
│   └── config.ts
├── Fun/                   # Fun commands
│   ├── 8ball.ts
│   ├── dice.ts
│   └── meme.ts
├── Information/           # Information commands
│   ├── help.ts
│   ├── serverinfo.ts
│   └── userinfo.ts
└── Utility/               # Utility commands
    ├── ping.ts
    ├── avatar.ts
    └── remind.ts
```

#### Components (`src/components/`)

Component handlers are organized by type and functionality:

```
src/components/
├── Buttons/               # Button interaction handlers
│   ├── confirmButton.ts
│   └── paginationButtons.ts
├── Forms/                 # Modal form handlers
│   ├── reportForm.ts
│   └── suggestionForm.ts
└── Menus/                 # Select menu handlers
    ├── roleSelector.ts
    └── helpCategorySelector.ts
```

#### Events (`src/events/`)

Event handlers are organized by source:

```
src/events/
├── client/                # Discord client events
│   ├── interactionCreate.ts
│   ├── messageCreate.ts
│   └── ready.ts
└── cluster/               # Sharding cluster events
    ├── ready.ts
    └── error.ts
```

#### Utilities (`src/utils/`)

Utility code is organized by functionality:

```
src/utils/
├── classes/               # Utility classes
│   ├── interactionCommandsSync.ts
│   └── database.ts
├── embeds/                # Discord embed templates
│   ├── errorEmbed.ts
│   └── dynamic/           # Dynamic embed generators
│       ├── CommandManager.ts
│       └── helpEmbed.ts
├── managers/              # System managers
│   ├── CommandManager.ts
│   ├── ComponentManager.ts
│   ├── CooldownManager.ts
│   ├── EventManager.ts
│   └── index.ts
├── structures/            # Core structures
│   ├── CommandExecutor.ts
│   ├── DiscordBot.ts
│   ├── Logger.ts
│   └── ShardingManager.ts
└── types/                 # TypeScript type definitions
    ├── commandManager.ts
    ├── componentManager.ts
    ├── eventTypes.ts
    └── globals.d.ts
```

## Core System Files

### Bot Initialization

- `src/index.ts` - Entry point that sets up sharding
- `src/Bot.ts` - Bot initialization and client setup

### Core Structures

- `src/utils/structures/DiscordBot.ts` - Main bot class extending Discord.js Client
- `src/utils/structures/CommandExecutor.ts` - Unified command execution interface
- `src/utils/structures/Logger.ts` - Logging utility
- `src/utils/structures/ShardingManager.ts` - Manages bot sharding

### Managers

- `src/utils/managers/index.ts` - Initializes and manages all subsystems
- `src/utils/managers/CommandManager.ts` - Loads and executes commands
- `src/utils/managers/ComponentManager.ts` - Handles UI component interactions
- `src/utils/managers/EventManager.ts` - Handles event registration and execution
- `src/utils/managers/CooldownManager.ts` - Manages command cooldowns

### Type Definitions

- `src/utils/types/commandManager.ts` - Command system types
- `src/utils/types/componentManager.ts` - Component system types
- `src/utils/types/eventTypes.ts` - Event system types
- `src/utils/types/globals.d.ts` - Global type declarations

## Flow of Execution

1. `index.ts` initializes the sharding system
2. `Bot.ts` creates an instance of `DiscordBot`
3. `DiscordBot` initializes the `Manager` system
4. `Manager` initializes all subsystems:
   - `EventManager` loads event handlers
   - `CommandManager` loads commands
   - `ComponentManager` loads component handlers
5. Once the Discord client is ready:
   - `InteractionManager` and `MessageManager` are initialized
   - Commands are registered with Discord API
6. The bot processes events, commands, and component interactions as they occur

## Adding New Files

### Adding a New Command

1. Create a new file in the appropriate category folder in `src/commands/`
2. Export a command definition using the `commandFile` function
3. The command will be automatically loaded and registered on bot startup

### Adding a New Component Handler

1. Create a new file in the appropriate category folder in `src/components/`
2. Export a component definition using one of the component functions (`buttonComponent`, `stringSelectComponent`, etc.)
3. The component handler will be automatically loaded on bot startup

### Adding a New Event Handler

1. Create a new file in the appropriate event source folder in `src/events/`
2. Export an event definition using the `eventFile` function
3. The event handler will be automatically loaded and registered on bot startup

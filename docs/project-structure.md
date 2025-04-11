# Project Structure

This document explains the project structure of the Discord bot, including the purpose of each directory and file.

## Directory Structure

```
discord-bot/
├── docs/                  # Documentation
├── src/                   # Source code
│   ├── commands/          # Bot commands
│   │   ├── General/       # General commands
│   │   ├── Info/          # Info commands
│   │   ├── Information/   # Information commands
│   │   ├── Settings/      # Settings commands
│   │   └── Utility/       # Utility commands
│   ├── components/        # UI component handlers
│   │   └── Utility/       # Utility components
│   ├── events/            # Event handlers
│   │   ├── client/        # Discord client events
│   │   └── cluster/       # Sharding cluster events
│   ├── locales/           # Translation files
│   ├── utils/             # Utility code
│   │   ├── embeds/        # Discord embed templates
│   │   │   └── dynamic/   # Dynamic embed generators
│   │   ├── helpers/       # Helper functions
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
├── General/               # General commands
│   ├── help.ts
│   └── hello.ts
├── Information/           # Information commands
│   ├── serverinfo.ts
│   └── userinfo.ts
├── Settings/              # Settings commands
│   ├── language.ts
│   └── config.ts
└── Utility/               # Utility commands
    ├── ping.ts
    └── avatar.ts
```

#### Components (`src/components/`)

Component handlers are organized by type and functionality:

```
src/components/
└── Utility/                # Utility component handlers
    ├── confirmButton.ts
    └── paginationButtons.ts
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

#### Locales (`src/locales/`)

Localization files for multi-language support:

```
src/locales/
├── en-US.json            # English (United States)
├── de-DE.json            # German (Germany)
└── fr-FR.json            # French (France)
```

#### Utilities (`src/utils/`)

Utility code is organized by functionality:

```
src/utils/
├── embeds/                # Discord embed templates
│   └── dynamic/           # Dynamic embed generators
│       ├── CommandManager.ts
│       └── helpEmbed.ts
├── helpers/               # Helper functions
│   ├── formatters.ts
│   └── validators.ts
├── managers/              # System managers
│   ├── CommandManager.ts
│   ├── ComponentManager.ts
│   ├── CooldownManager.ts
│   ├── EventManager.ts
│   ├── LocaleManager.ts
│   ├── MessageManager.ts
│   └── InteractionManager.ts
├── structures/            # Core structures
│   ├── CommandExecutor.ts
│   ├── DiscordBot.ts
│   └── Logger.ts
└── types/                 # TypeScript type definitions
    ├── commandManager.ts
    ├── componentManager.ts
    └── eventTypes.ts
```

## Core System Files

### Bot Initialization

- `src/index.ts` - Entry point that sets up sharding
- `src/Bot.ts` - Bot initialization and client setup

### Core Structures

- `src/utils/structures/DiscordBot.ts` - Main bot class extending Discord.js Client
- `src/utils/structures/CommandExecutor.ts` - Unified command execution interface
- `src/utils/structures/Logger.ts` - Logging utility

### Managers

- `src/utils/managers/CommandManager.ts` - Loads and executes commands
- `src/utils/managers/ComponentManager.ts` - Handles UI component interactions
- `src/utils/managers/CooldownManager.ts` - Manages command cooldowns
- `src/utils/managers/EventManager.ts` - Handles event registration and execution
- `src/utils/managers/LocaleManager.ts` - Handles translations and localization
- `src/utils/managers/MessageManager.ts` - Processes message commands
- `src/utils/managers/InteractionManager.ts` - Processes interaction commands

### Localization System

- `src/locales/*.json` - Translation files in JSON format
- `src/utils/managers/LocaleManager.ts` - Manages loading and using translations

## Flow of Execution

1. `index.ts` initializes the bot
2. `Bot.ts` creates an instance of `DiscordBot`
3. `DiscordBot` initializes all managers:
   - `EventManager` loads event handlers
   - `CommandManager` loads commands
   - `ComponentManager` loads component handlers
   - `LocaleManager` loads translations
4. Once the Discord client is ready:
   - `InteractionManager` and `MessageManager` are initialized
   - Commands are registered with Discord API
5. The bot processes events, commands, and component interactions as they occur

## Adding New Files

### Adding a New Command

1. Create a new file in the appropriate category folder in `src/commands/`
2. Export a command definition using the `commandFile` function
3. The command will be automatically loaded and registered on bot startup

### Adding a New Component Handler

1. Create a new file in the appropriate category folder in `src/components/`
2. Export a component definition using the component factory function
3. The component handler will be automatically loaded on bot startup

### Adding a New Event Handler

1. Create a new file in the appropriate event source folder in `src/events/`
2. Export an event definition using the event factory function
3. The event handler will be automatically loaded and registered on bot startup

### Adding a New Locale

1. Create a new JSON file in `src/locales/` named after the locale code (e.g., `es-ES.json`)
2. Follow the structure of existing locale files
3. The locale will be automatically loaded on bot startup

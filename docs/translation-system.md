# Translation System

This document explains how to use the bot's translation and localization system to support multiple languages.

## Table of Contents

- [Overview](#overview)
- [Setting Up Translations](#setting-up-translations)
- [Using Translations](#using-translations)
  - [Basic Translation](#basic-translation)
  - [Translations with Parameters](#translations-with-parameters)
  - [Fallbacks](#fallbacks)
- [Managing Locales](#managing-locales)
- [User Preferences](#user-preferences)
- [Translation Files](#translation-files)
- [Best Practices](#best-practices)

## Overview

The bot includes a flexible translation system through the `LocaleManager` class. This system allows you to:

- Support multiple languages
- Automatically use the user's Discord locale settings
- Replace variables in translation strings
- Fallback to default locale when a translation is missing

## Setting Up Translations

To enable translations, make sure the `withLocales` option is enabled in your bot config:

```typescript
// config.ts
export default {
  // Other config options...
  withLocales: true,
  defaultLocale: 'en-US'
};
```

Translation files are stored in a `locales` directory, with each locale having its own JSON file:

```
locales/
├── en-US.json
├── es-ES.json
├── fr-FR.json
└── ...
```

Each translation file follows a nested structure with keys:

```json
{
  "commands": {
    "hello": {
      "greeting": "Hello there!",
      "welcome": "Welcome to {server}, {username}!"
    },
    "help": {
      "title": "Help Menu",
      "description": "Here are the available commands:"
    }
  },
  "errors": {
    "commandNotFound": "Command not found: {command}",
    "guildOnly": "This command can only be used in a server."
  }
}
```

## Using Translations

The translation system is accessed through the `t()` method available on the `Manager` class:

### Basic Translation

```typescript
// Get a simple translation string
const greeting = client.manager.t({ key: "commands.hello.greeting" });

// Send the translated message
await interaction.reply(greeting);
```

### Translations with Parameters

You can include dynamic variables in your translations using curly braces:

```typescript
// Translation string with replacements
const welcomeMessage = client.manager.t({
  key: "commands.hello.welcome",
  replacements: {
    username: user.username,
    server: guild.name
  }
});

// Send the personalized welcome message
await interaction.reply(welcomeMessage);
```

### Locale Specification

You can specify which locale to use:

```typescript
// Use a specific locale
const frenchGreeting = client.manager.t({
  key: "commands.hello.greeting",
  locale: "fr-FR"
});

// Or use the user's preferred locale from Discord
const userLocale = interaction.locale;
const localizedGreeting = client.manager.t({
  key: "commands.hello.greeting",
  locale: userLocale
});
```

## Managing Locales

The `LocaleManager` provides methods to manage available locales:

```typescript
// Get all available locales
const locales = client.manager.localeManager?.getAvailableLocales();

// Check if a locale is available
const isSpanishAvailable = client.manager.localeManager?.isLocaleAvailable('es-ES');
```

## User Preferences

You can store user language preferences in a database:

```typescript
// Example command to set a user's preferred language
export const data = commandFile({
  data: new SlashCommandBuilder()
    .setName("language")
    .setDescription("Set your preferred language")
    .addStringOption(option => 
      option.setName("locale")
        .setDescription("The language to use")
        .setRequired(true)
        .addChoices(
          { name: 'English', value: 'en-US' },
          { name: 'Español', value: 'es-ES' },
          { name: 'Français', value: 'fr-FR' }
        )),
  
  execute: async (cmdExecutor) => {
    const locale = cmdExecutor.getString("locale", true);
    
    // Save to database
    await db.users.update({
      where: { id: cmdExecutor.getAuthor.id },
      data: { preferredLocale: locale }
    });
    
    // Reply using their newly selected language
    const message = cmdExecutor.client.manager.t({
      key: "commands.language.success",
      locale
    });
    
    await cmdExecutor.reply(message);
  }
});
```

## Translation Files

Each locale file should have the same structure, but with translated content. For example:

**en-US.json**:
```json
{
  "commands": {
    "hello": {
      "greeting": "Hello!"
    }
  }
}
```

**fr-FR.json**:
```json
{
  "commands": {
    "hello": {
      "greeting": "Bonjour !"
    }
  }
}
```

## Best Practices

1. **Use Descriptive Keys**: Structure your keys logically (e.g., `category.subcategory.name`)

2. **Provide Default Translations**: Always have complete translations in your default locale

3. **Handle Variables Consistently**: Use a consistent format for variable placeholders

4. **Consider Context**: Sometimes the same word might translate differently in different contexts

5. **Test All Locales**: Verify that UI elements work properly in all supported languages (some languages might be longer and break your UI)

6. **Manage Missing Translations**: Fall back gracefully when a translation is missing

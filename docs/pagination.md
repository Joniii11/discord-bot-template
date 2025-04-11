# Pagination System

This document explains how to use the pagination utility to create interactive paginated messages and embeds.

## Table of Contents

- [Overview](#overview)
- [Basic Usage](#basic-usage)
- [Customization Options](#customization-options)
- [Examples](#examples)
  - [Help Command with Pagination](#help-command-with-pagination)
  - [Search Results Pagination](#search-results-pagination)
  - [Custom Button Labels](#custom-button-labels)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

The pagination system allows you to create messages with multiple pages that users can navigate through using buttons. This is useful for commands that return large amounts of information, such as help menus, search results, or long lists.

Key features:
- Type-safe button interactions
- Customizable button labels
- Automatic page numbering
- Automatic button disabling at page limits
- Configurable timeout

## Basic Usage

The pagination system is built around the `createPagination` function:

```typescript
import { createPagination } from '../../utils/helpers/pagination.js';

// In a command's execute function:
export const data = commandFile({
  // Command definition...
  
  execute: async (cmdExecutor) => {
    // Create an array of embeds, one for each page
    const embeds = [
      new EmbedBuilder().setTitle('Page 1').setDescription('First page content'),
      new EmbedBuilder().setTitle('Page 2').setDescription('Second page content'),
      new EmbedBuilder().setTitle('Page 3').setDescription('Third page content')
    ];
    
    // Create the paginated message
    await createPagination(cmdExecutor, {
      embeds: embeds,
      time: 120000 // Optional: timeout in ms (default: 5 minutes)
    });
  }
});
```

## Customization Options

The `createPagination` function accepts various options:

```typescript
interface PaginationOptions {
  // Required: Array of embeds to paginate
  embeds: EmbedBuilder[];
  
  // Optional: Time in ms before buttons are disabled (default: 300000 - 5 minutes)
  time?: number;
  
  // Optional: Custom button labels
  firstLabel?: string;
  previousLabel?: string;
  nextLabel?: string;
  lastLabel?: string;
}
```

## Examples

### Help Command with Pagination

```typescript
// src/commands/Information/help.ts
import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";
import { createPagination } from "../../utils/helpers/pagination.js";

export const data = commandFile({
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows all available commands")
    .addStringOption(option => 
      option.setName("category")
        .setDescription("The category to show commands from")
        .setRequired(false)),
  
  execute: async (cmdExecutor) => {
    const { client } = cmdExecutor;
    const categories = [...new Set(
      Array.from(client.manager.commandManager.getCommands.values())
        .map(cmd => cmd.options?.category || "Uncategorized")
    )];
    
    // Create an embed for each category
    const embeds = categories.map(category => {
      const commands = Array.from(client.manager.commandManager.getCommands.values())
        .filter(cmd => cmd.options?.category === category);
      
      return new EmbedBuilder()
        .setTitle(`${category} Commands`)
        .setDescription(commands.map(cmd => 
          `**/${cmd.name}** - ${cmd.data.description}`
        ).join('\n'))
        .setColor("Blue");
    });
    
    // Create the paginated help menu
    await createPagination(cmdExecutor, { embeds });
  }
});
```

### Search Results Pagination

```typescript
// src/commands/Utility/search.ts
export const data = commandFile({
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search for something")
    .addStringOption(option =>
      option.setName("query")
        .setDescription("What to search for")
        .setRequired(true)),
  
  execute: async (cmdExecutor) => {
    const query = cmdExecutor.getString("query", true);
    
    // Simulate search results (in a real command, this would fetch data)
    const results = await simulateSearch(query);
    
    // Split results into pages (10 results per page)
    const pageSize = 10;
    const pages = [];
    
    for (let i = 0; i < results.length; i += pageSize) {
      const pageResults = results.slice(i, i + pageSize);
      
      const embed = new EmbedBuilder()
        .setTitle(`Search Results for "${query}"`)
        .setDescription(pageResults.map((result, index) => 
          `${i + index + 1}. **${result.title}** - ${result.description}`
        ).join('\n'));
      
      pages.push(embed);
    }
    
    if (pages.length === 0) {
      // No results
      return cmdExecutor.reply(`No results found for "${query}"`);
    }
    
    // Create pagination
    await createPagination(cmdExecutor, { 
      embeds: pages,
      time: 180000 // 3 minutes
    });
  }
});
```

### Custom Button Labels

```typescript
// Using custom labels for the pagination buttons
await createPagination(cmdExecutor, {
  embeds: embeds,
  firstLabel: '<<',
  previousLabel: '<',
  nextLabel: '>',
  lastLabel: '>>'
});
```

## Error Handling

The pagination system handles various edge cases:

1. **Empty Embeds**: If an empty array of embeds is provided, an error is thrown
2. **Single Page**: If only one embed is provided, it's sent without pagination buttons
3. **User Mismatch**: Only the command invoker can use the pagination buttons
4. **Timeouts**: Buttons are automatically disabled after the specified timeout

## Best Practices

1. **Reasonable Page Count**: Keep the number of pages reasonable (under 20)
2. **Consistent Content Size**: Try to keep a similar amount of content on each page
3. **Clear Navigation Hints**: Include page numbers in footers (done automatically if not already present)
4. **Timeout Consideration**: Set an appropriate timeout based on content type
5. **Error Handling**: Wrap pagination in try/catch blocks for graceful error handling
6. **Dynamic Content**: For dynamic data, consider creating embeds on-demand as pages are requested

# Component System

The component system provides a type-safe way to handle Discord UI components like buttons, select menus, and modals.

## Table of Contents

- [Overview](#overview)
- [Button Components](#button-components)
  - [Simple Button](#simple-button)
  - [Button with Pattern Matching](#button-with-pattern-matching)
- [Select Menu Components](#select-menu-components)
  - [String Select Menu](#string-select-menu)
  - [User Select Menu](#user-select-menu)
- [Modal Components](#modal-components)
- [Component Options](#component-options)
- [Component Patterns](#component-patterns)
- [Creating Interactive UIs](#creating-interactive-uis)
- [Best Practices](#best-practices)

## Overview

The component system features:

- Type-safe handling of buttons, select menus, and modals
- Support for exact ID matching or pattern-based matching
- Component cooldowns
- Organization by categories

Components are managed through the `ComponentManager` class, which:

1. Loads component handlers from files
2. Registers handlers by component ID or pattern
3. Routes interactions to the appropriate handlers
4. Provides cooldown management

## Button Components

Buttons are the simplest UI component. You can handle button interactions in two ways:

### Simple Button

For buttons with a fixed custom ID:

```typescript
// src/components/Utility/closeButton.ts
import { ButtonInteraction, EmbedBuilder } from "discord.js";
import { buttonComponent } from "../../utils/types/componentManager.js";

export const data = buttonComponent({
  id: "close_menu", // Exact match for buttons with this ID
  options: {
    cooldown: 2,     // Optional cooldown in seconds
    category: "Utility"
  },
  execute: async (client, interaction: ButtonInteraction) => {
    // Check if the user who clicked is the same who created the menu
    const creatorId = interaction.message.embeds[0]?.footer?.text?.match(/ID: (\d+)/)?.[1];
    
    if (creatorId && creatorId !== interaction.user.id) {
      return interaction.reply({
        content: "Only the person who opened this menu can close it.",
        ephemeral: true
      });
    }
    
    // Delete the message with the menu
    await interaction.message.delete();
  }
});
```

### Button with Pattern Matching

For buttons with dynamic IDs (like pagination):

```typescript
// src/components/Utility/paginationButtons.ts
import { ButtonInteraction, EmbedBuilder } from "discord.js";
import { buttonPattern } from "../../utils/types/componentManager.js";

export const data = buttonPattern({
  idPattern: /^page_(\d+)_of_(\d+)_user_(\d+)$/,
  options: {
    cooldown: 1,
    category: "Utility"
  },
  // With pattern matching, the execute function receives matches array as third parameter
  execute: async (client, interaction: ButtonInteraction, matches: string[]) => {
    // matches contains: [full_match, group1, group2, group3, ...]
    // For "page_2_of_5_user_123456789", matches would be:
    // ["page_2_of_5_user_123456789", "2", "5", "123456789"]
    const [, currentPage, totalPages, userId] = matches;
    
    // Check permissions
    if (interaction.user.id !== userId) {
      return interaction.reply({
        content: "Only the command author can change pages.",
        ephemeral: true
      });
    }
    
    // Update the page content
    const pageNum = parseInt(currentPage);
    const maxPages = parseInt(totalPages);
    
    // Get content for the current page
    const pageContent = await getPageContent(pageNum, maxPages);
    
    // Update the message
    await interaction.update({
      embeds: [
        new EmbedBuilder()
          .setTitle(`Page ${pageNum} of ${maxPages}`)
          .setDescription(pageContent)
          .setFooter({ text: `Requested by user ID: ${userId}` })
      ],
      components: [createPaginationRow(pageNum, maxPages, userId)]
    });
  }
});

// Helper function to create pagination controls
function createPaginationRow(current, total, userId) {
  const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
  
  const row = new ActionRowBuilder();
  
  // Previous button
  const prevBtn = new ButtonBuilder()
    .setCustomId(`page_${Math.max(1, current - 1)}_of_${total}_user_${userId}`)
    .setLabel('Previous')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(current <= 1);
  
  // Next button
  const nextBtn = new ButtonBuilder()
    .setCustomId(`page_${Math.min(total, current + 1)}_of_${total}_user_${userId}`)
    .setLabel('Next')
    .setStyle(ButtonStyle.Primary)
    .setDisabled(current >= total);
  
  row.addComponents(prevBtn, nextBtn);
  
  return row;
}

// Get content for a specific page
async function getPageContent(page, total) {
  // Fetch content for the requested page
  return `This is page ${page} of ${total}.\n\nContent for this page goes here.`;
}
```

## Select Menu Components

Select menus allow users to choose from a list of options. There are several types:

### String Select Menu

```typescript
// src/components/Settings/roleSelector.ts
import { StringSelectMenuInteraction } from "discord.js";
import { stringSelectComponent } from "../../utils/types/componentManager.js";

export const data = stringSelectComponent({
  id: "role_selector",
  options: {
    cooldown: 5,
    category: "Settings"
  },
  execute: async (client, interaction: StringSelectMenuInteraction) => {
    const selectedRoles = interaction.values;
    
    // Process the selected roles
    await interaction.reply({
      content: `You selected the following roles: ${selectedRoles.join(", ")}`,
      ephemeral: true
    });
    
    // Add/remove roles logic here...
  }
});
```

### User Select Menu

```typescript
// src/components/Moderation/userSelector.ts
import { UserSelectMenuInteraction } from "discord.js";
import { userSelectComponent } from "../../utils/types/componentManager.js";

export const data = userSelectComponent({
  id: "warn_user_selector",
  options: {
    category: "Moderation"
  },
  execute: async (client, interaction: UserSelectMenuInteraction) => {
    const selectedUsers = interaction.values;
    
    // Show warning form for selected users
    await interaction.reply({
      content: `You're about to warn ${selectedUsers.length} users. Please provide a reason:`,
      components: [
        {
          type: 1,
          components: [
            {
              type: 4, // Text input
              custom_id: "warn_reason",
              style: 2, // Paragraph
              label: "Warning Reason",
              placeholder: "Enter the reason for the warning",
              required: true
            }
          ]
        }
      ],
      ephemeral: true
    });
  }
});
```

## Modal Components

Modals allow collecting form data from users:

```typescript
// src/components/Forms/feedbackForm.ts
import { ModalSubmitInteraction } from "discord.js";
import { modalComponent } from "../../utils/types/componentManager.js";

export const data = modalComponent({
  id: "feedback_form",
  options: {
    category: "Forms"
  },
  execute: async (client, interaction: ModalSubmitInteraction) => {
    // Get values from the form fields
    const feedbackType = interaction.fields.getTextInputValue('feedback_type');
    const feedbackContent = interaction.fields.getTextInputValue('feedback_content');
    
    // Process the feedback
    await interaction.reply({
      content: `Thank you for your ${feedbackType} feedback!`,
      ephemeral: true
    });
    
    // Log or store the feedback
    client.logger.info(`Feedback from ${interaction.user.tag}: ${feedbackContent}`);
    
    // You could also send it to a feedback channel
    const feedbackChannel = client.channels.cache.get('FEEDBACK_CHANNEL_ID');
    if (feedbackChannel?.isTextBased()) {
      await feedbackChannel.send({
        embeds: [{
          title: `New ${feedbackType} Feedback`,
          description: feedbackContent,
          fields: [{ name: 'From', value: interaction.user.tag }],
          color: 0x00FF00,
          timestamp: new Date()
        }]
      });
    }
  }
});
```

## Component Options

Components can have various options:

```typescript
options: {
  // Component category for organization
  category: "Category",
  
  // Cooldown in seconds (0 = no cooldown)
  cooldown: 5
}
```

## Component Patterns

For components with dynamic IDs, use pattern-based components:

```typescript
// Button with a pattern
buttonPattern({
  idPattern: /^delete_message_(\d+)_by_(\d+)$/,
  execute: async (client, interaction, matches) => {
    // matches array contains [full_match, messageId, authorId]
    const [, messageId, authorId] = matches;
    
    // Check permission
    if (interaction.user.id !== authorId) {
      return interaction.reply({
        content: "You can only delete your own messages.",
        ephemeral: true
      });
    }
    
    // Delete the message
    await interaction.message.delete();
  }
});

// Select menu with a pattern
stringSelectPattern({
  idPattern: /^quiz_(\d+)_question_(\d+)$/,
  execute: async (client, interaction, matches) => {
    // matches array contains [full_match, quizId, questionId]
    const [, quizId, questionId] = matches;
    
    // Process the answer
    const selectedAnswer = interaction.values[0];
    // Quiz logic...
  }
});
```

## Creating Interactive UIs

You can combine components to create interactive UIs:

```typescript
// Example command that shows an interactive menu
export const data = commandFile({
  data: new SlashCommandBuilder()
    .setName("menu")
    .setDescription("Shows an interactive menu"),
  
  execute: async (cmdExecutor) => {
    // Create buttons
    const row1 = new ActionRowBuilder<ButtonBuilder>()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('menu_option_1')
          .setLabel('Option 1')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('menu_option_2')
          .setLabel('Option 2')
          .setStyle(ButtonStyle.Secondary)
      );
    
    // Create a select menu
    const row2 = new ActionRowBuilder<StringSelectMenuBuilder>()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('menu_select')
          .setPlaceholder('Choose an option')
          .addOptions([
            { label: 'Option A', value: 'a' },
            { label: 'Option B', value: 'b' },
            { label: 'Option C', value: 'c' }
          ])
      );
    
    // Send the menu
    await cmdExecutor.reply({
      content: 'Here\'s your interactive menu:',
      components: [row1, row2]
    });
  }
});

// Then handle interactions in separate component handlers
```

## Best Practices

1. **Pattern Matching Usage** - When using patterns, remember you get an array of matches:
   ```typescript
   // In pattern components:
   execute: async (client, interaction, matches) => {
     const [fullMatch, ...captureGroups] = matches;
     // Use captureGroups as needed
   }
   ```

2. **Security checking** - Always verify the user has permission to use the component
3. **Error handling** - Include try/catch blocks to gracefully handle errors
4. **Time limits** - Remember that components expire after 24 hours in messages
5. **Component organization** - Group related components in the same file or directory
6. **State management** - For complex interactions, consider storing state in a database
7. **Ephemeral responses** - Use ephemeral responses for administrative actions

import { 
    ActionRowBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    EmbedBuilder,
    ComponentType
} from 'discord.js';
import CommandExecutor, { ExecutorMode } from '../structures/CommandExecutor.js';

export interface PaginationOptions {
    /**
     * The embeds to paginate
     */
    embeds: EmbedBuilder[];
    
    /**
     * Time in milliseconds before buttons are disabled
     * @default 300000 (5 minutes)
     */
    time?: number;
    
    /**
     * Text to show on the "first" button
     * @default "First"
     */
    firstLabel?: string;
    
    /**
     * Text to show on the "previous" button
     * @default "Previous"
     */
    previousLabel?: string;
    
    /**
     * Text to show on the "next" button
     * @default "Next"
     */
    nextLabel?: string;
    
    /**
     * Text to show on the "last" button
     * @default "Last"
     */
    lastLabel?: string;
}

/**
 * Creates a paginated embed message with navigation buttons
 * @param cmdExecutor - The command executor instance
 * @param options - Pagination options
 */
export async function createPagination(cmdExecutor: CommandExecutor<ExecutorMode>, options: PaginationOptions): Promise<void> {
    const { embeds, time = 300000 } = options;
    
    if (embeds.length === 0) {
        throw new Error("No embeds provided for pagination");
    }
    
    // Add page numbers to embeds if not already present
    embeds.forEach((embed, i) => {
        if (!embed.data.footer) {
            embed.setFooter({ text: `Page ${i + 1} of ${embeds.length}` });
        }
    });
    
    // If only one page, just send it without buttons
    if (embeds.length === 1) {
        await cmdExecutor.reply({ embeds: [embeds[0]] });
        return;
    }
    
    let currentPage = 0;
    
    // Create navigation buttons
    const createButtons = () => {
        const firstButton = new ButtonBuilder()
            .setCustomId('pagination_first')
            .setLabel(options.firstLabel || 'First')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0);
            
        const previousButton = new ButtonBuilder()
            .setCustomId('pagination_previous')
            .setLabel(options.previousLabel || 'Previous')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === 0);
            
        const nextButton = new ButtonBuilder()
            .setCustomId('pagination_next')
            .setLabel(options.nextLabel || 'Next')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === embeds.length - 1);
            
        const lastButton = new ButtonBuilder()
            .setCustomId('pagination_last')
            .setLabel(options.lastLabel || 'Last')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(currentPage === embeds.length - 1);
            
        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(firstButton, previousButton, nextButton, lastButton);
            
        return row;
    };
    
    // Send initial message
    const message = await cmdExecutor.reply({ 
        embeds: [embeds[currentPage]],
        components: [createButtons()],
        fetchReply: true
    });
    
    // Create collector for button interactions
    const collector = message.createMessageComponentCollector({ 
        componentType: ComponentType.Button,
        time
    });
    
    collector.on('collect', async (interaction) => {
        // Ensure only the command author can use the buttons
        if (interaction.user.id !== cmdExecutor.getAuthor.id) {
            await interaction.reply({ 
                content: "You can't use these buttons as they weren't created by your command.", 
                ephemeral: true 
            });
            return;
        }
        
        // Update current page based on button
        switch (interaction.customId) {
            case 'pagination_first':
                currentPage = 0;
                break;
            case 'pagination_previous':
                currentPage = Math.max(0, currentPage - 1);
                break;
            case 'pagination_next':
                currentPage = Math.min(embeds.length - 1, currentPage + 1);
                break;
            case 'pagination_last':
                currentPage = embeds.length - 1;
                break;
        }
        
        // Update the message
        await interaction.update({
            embeds: [embeds[currentPage]],
            components: [createButtons()]
        });
    });
    
    collector.on('end', async () => {
        // Disable all buttons when collector ends
        const disabledRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('pagination_first')
                    .setLabel(options.firstLabel || 'First')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('pagination_previous')
                    .setLabel(options.previousLabel || 'Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('pagination_next')
                    .setLabel(options.nextLabel || 'Next')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('pagination_last')
                    .setLabel(options.lastLabel || 'Last')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true)
            );
        
        // Try to update the message, but don't throw if it fails
        try {
            await message.edit({ components: [disabledRow] });
        } catch (error) {
            // Message might be deleted or too old to edit
        }
    });
}

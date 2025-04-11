import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } from 'discord.js';
/**
 * Creates a paginated embed message with navigation buttons
 * @param cmdExecutor - The command executor instance
 * @param options - Pagination options
 */
export async function createPagination(cmdExecutor, options) {
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
        const row = new ActionRowBuilder()
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
        const disabledRow = new ActionRowBuilder()
            .addComponents(new ButtonBuilder()
            .setCustomId('pagination_first')
            .setLabel(options.firstLabel || 'First')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true), new ButtonBuilder()
            .setCustomId('pagination_previous')
            .setLabel(options.previousLabel || 'Previous')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true), new ButtonBuilder()
            .setCustomId('pagination_next')
            .setLabel(options.nextLabel || 'Next')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true), new ButtonBuilder()
            .setCustomId('pagination_last')
            .setLabel(options.lastLabel || 'Last')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true));
        // Try to update the message, but don't throw if it fails
        try {
            await message.edit({ components: [disabledRow] });
        }
        catch (error) {
            // Message might be deleted or too old to edit
        }
    });
}

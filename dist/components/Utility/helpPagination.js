import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { buttonPattern } from "../../utils/types/componentManager.js";
// Button handler for help command pagination
export const data = buttonPattern({
    id: "help_pagination",
    idPattern: /^help_pagination:(\d+):(\d+)$/, // Match help_pagination:page:totalPages
    options: {
        cooldown: 1,
        category: "Utility"
    },
    execute: async (client, interaction, params) => {
        // Params is a simple string array with the captured groups
        const currentPage = parseInt(params[0]);
        const totalPages = parseInt(params[1]);
        const helpData = await getHelpPageContent(currentPage);
        const embed = new EmbedBuilder()
            .setTitle(`Help Menu - Page ${currentPage}/${totalPages}`)
            .setDescription(helpData)
            .setColor(0x0099FF)
            .setFooter({
            text: `Page ${currentPage} of ${totalPages}`
        })
            .setTimestamp();
        await interaction.update({
            embeds: [embed],
            components: [createPaginationRow(currentPage, totalPages)]
        });
    }
});
async function getHelpPageContent(page) {
    const helpPages = [
        "**Basic Commands**\n`/help` - Show this help menu\n`/ping` - Check the bot's latency\n`/info` - Get information about the bot",
        "**Moderation Commands**\n`/kick` - Kick a member\n`/ban` - Ban a member\n`/mute` - Mute a member",
        "**Utility Commands**\n`/avatar` - Get a user's avatar\n`/serverinfo` - Get information about the server"
    ];
    return helpPages[page - 1] || "No commands found for this page";
}
// Create the pagination row with the appropriate buttons
function createPaginationRow(currentPage, totalPages) {
    const row = new ActionRowBuilder();
    // Previous button
    const prevButton = new ButtonBuilder()
        .setCustomId(`help_pagination:${Math.max(1, currentPage - 1)}:${totalPages}`)
        .setLabel('Previous')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage <= 1);
    // Next button
    const nextButton = new ButtonBuilder()
        .setCustomId(`help_pagination:${Math.min(totalPages, currentPage + 1)}:${totalPages}`)
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage >= totalPages);
    row.addComponents(prevButton, nextButton);
    return row;
}

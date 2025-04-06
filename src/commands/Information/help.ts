import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";

export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("Shows paginated help information about the bot's commands."),
    options: {
        slashOnly: true
    },

    execute: async (cmdExecutor) => {
        const totalPages = 3; // In a real implementation, this would be dynamic
        const currentPage = 1;
        
        // Get initial help content
        const initialContent = await getHelpPageContent(currentPage);
        
        // Create embed
        const embed = new EmbedBuilder()
            .setTitle(`Help Menu - Page ${currentPage}/${totalPages}`)
            .setDescription(initialContent)
            .setColor(0x0099FF)
            .setFooter({
                text: `Page ${currentPage} of ${totalPages}`
            })
            .setTimestamp();
            
        // Create pagination buttons
        const row = createPaginationRow(currentPage, totalPages);
        
        await cmdExecutor.reply({
            embeds: [embed],
            components: [row]
        });
    }
});

// This would be replaced by actual help data in your implementation
async function getHelpPageContent(page: number): Promise<string> {
  const helpPages = [
    "**Basic Commands**\n`/help` - Show this help menu\n`/ping` - Check the bot's latency\n`/info` - Get information about the bot",
    "**Moderation Commands**\n`/kick` - Kick a member\n`/ban` - Ban a member\n`/mute` - Mute a member",
    "**Utility Commands**\n`/avatar` - Get a user's avatar\n`/serverinfo` - Get information about the server"
  ];
  
  return helpPages[page - 1] || "No commands found for this page";
}

// Create the pagination row with the appropriate buttons
function createPaginationRow(currentPage: number, totalPages: number) {
  const row = new ActionRowBuilder<ButtonBuilder>();
  
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

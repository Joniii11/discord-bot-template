import { 
    ActionRowBuilder, 
    ModalBuilder, 
    SlashCommandBuilder, 
    TextInputBuilder, 
    TextInputStyle 
} from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";

export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("feedback")
        .setDescription("Submit feedback about the bot"),
    options: {
        slashOnly: true
    },

    execute: async (cmdExecutor) => {
        // Create the modal
        const modal = new ModalBuilder()
            .setCustomId('feedback_submit')
            .setTitle('Submit Feedback');

        // Create the text input components
        const feedbackTypeInput = new TextInputBuilder()
            .setCustomId('feedbackType')
            .setLabel("What type of feedback do you have?")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Bug report, feature request, etc.')
            .setRequired(true);

        const feedbackContentInput = new TextInputBuilder()
            .setCustomId('feedbackContent')
            .setLabel("Please describe your feedback")
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('I found a bug when...')
            .setMaxLength(1000)
            .setRequired(true);

        // Add inputs to the modal
        const firstActionRow = new ActionRowBuilder<TextInputBuilder>()
            .addComponents(feedbackTypeInput);
        const secondActionRow = new ActionRowBuilder<TextInputBuilder>()
            .addComponents(feedbackContentInput);

        // Add inputs to the modal
        modal.addComponents(firstActionRow, secondActionRow);

        // Show the modal to the user
        await cmdExecutor.showModal(modal);
    }
});

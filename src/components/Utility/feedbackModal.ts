import { EmbedBuilder, ModalSubmitInteraction } from "discord.js";
import { modalComponent } from "../../utils/types/componentManager.js";

export const data = modalComponent({
  id: "feedback_submit",
  options: {
    category: "Utility"
  },
  execute: async (client, interaction: ModalSubmitInteraction) => {
    // Get the data entered by the user
    const feedbackType = interaction.fields.getTextInputValue('feedbackType');
    const feedbackContent = interaction.fields.getTextInputValue('feedbackContent');
    
    // Create a rich embed to display the feedback nicely
    const embed = new EmbedBuilder()
      .setTitle('Feedback Received')
      .setColor(0x00FF00)
      .setDescription('Thank you for your feedback!')
      .addFields(
        { name: 'Type', value: feedbackType },
        { name: 'Content', value: feedbackContent }
      )
      .setTimestamp()
      .setFooter({ text: 'Feedback System' });
    
    // Acknowledge the submission
    await interaction.reply({
      embeds: [embed],
      ephemeral: true
    });
    
    // You could also log this feedback to a database or a channel
    client.logger.info(`Feedback received from ${interaction.user.tag}: ${feedbackType} - ${feedbackContent}`);
  }
});

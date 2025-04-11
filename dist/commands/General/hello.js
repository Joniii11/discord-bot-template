import { SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";
export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("hello")
        .setDescription("Greet someone in their language"),
    execute: async (cmdExecutor) => {
        // Get the user's preferred locale (from interaction) or default
        const locale = cmdExecutor.isInteraction()
            ? cmdExecutor.interaction.locale // User's Discord client locale
            : "en-US"; // Default for message commands
        // Use the translator with a simple key
        const greeting = cmdExecutor.client.manager.t({ key: "commands.hello.greeting", locale });
        await cmdExecutor.reply(greeting);
    }
});

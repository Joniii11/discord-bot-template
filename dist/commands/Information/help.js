import { SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";
export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("This shows the help menu of the bot."),
    execute: async (cmdExecutor) => {
    }
});

import { SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";
export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("greet")
        .setDescription("Greet a user")
        .addUserOption(option => option.setName("user")
        .setDescription("User to greet")
        .setRequired(true)),
    execute: async (cmdExecutor) => {
        const user = cmdExecutor.getUser("user", true);
        // Simple translation with one replacement
        const greeting = cmdExecutor.client.manager.t({ key: "commands.greet.hello", replacements: {
                username: user.username
            } });
        await cmdExecutor.reply(greeting);
    }
});

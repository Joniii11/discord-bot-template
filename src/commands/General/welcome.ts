import { SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";

export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("welcome")
        .setDescription("Welcome a user")
        .addUserOption(option => 
            option.setName("user")
                .setDescription("User to welcome")
                .setRequired(true)
        ),
    
    execute: async (cmdExecutor) => {
        const user = cmdExecutor.getUser("user", true);
        const locale = cmdExecutor.isInteraction() ? cmdExecutor.interaction.locale : "en-US";
        
        // Translate with placeholders
        const welcomeMessage = cmdExecutor.client.manager.t({
            key: "commands.welcome.message", 
            locale, 
            replacements: {
                username: user.username,
                server: cmdExecutor.isMessage() ? cmdExecutor.message.guild?.name || "server" : 
                        cmdExecutor.interaction!.guild?.name || "server"
            }
        });
        
        await cmdExecutor.reply(welcomeMessage);
    }
});

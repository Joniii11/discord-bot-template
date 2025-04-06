import { SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";
export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check the bot's latency"),
    options: {
        cooldown: 5, // 5 second cooldown
        aliases: ["latency"], // Aliases for message commands
        category: "Utility" // Optional, defaults to folder namename
    },
    execute: async (cmdExecutor) => {
        const startTime = Date.now();
        const msg = await cmdExecutor.reply("Pinging...");
        const endTime = Date.now();
        const ping = endTime - startTime;
        const apiPing = cmdExecutor.client.ws.ping;
        // Use the unified method that handles both interaction and message modes
        const response = `Pong! 🏓\nBot Latency: ${ping}ms\nAPI Latency: ${apiPing}ms`;
        if (cmdExecutor.isInteraction()) {
            await cmdExecutor.editReply(response);
        }
        else {
            // For message mode, reply to the original message
            await cmdExecutor.editReply(msg, `${response}`);
        }
    }
});

import { SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";

export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check the bot's latency"),
    
    options: {
        cooldown: 5,
        aliases: ["latency"],
        category: "Utility"
    },
    
    execute: async (cmdExecutor) => {
        const startTime = Date.now();
        const msg = await cmdExecutor.reply("Pinging...");
        const endTime = Date.now();
        
        const ping = endTime - startTime;
        const apiPing = cmdExecutor.client.ws.ping;
        const response = `Pong! 🏓\nBot Latency: ${ping}ms\nAPI Latency: ${apiPing}ms`;
        
        // withMode option
        await cmdExecutor.editReply(msg, response);
        /*await cmdExecutor.withMode({
            interaction: (exec) => exec.editReply(response),
            message: (exec) => exec.editReply(msg, response)
        });*/
        
        // Alternatively, you can use type guards
        // if (cmdExecutor.isInteraction()) {
        //     await cmdExecutor.editReply(response);
        // } else {
        //     await cmdExecutor.editReply(msg, response);
        // }
    }
});
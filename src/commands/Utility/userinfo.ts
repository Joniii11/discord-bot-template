import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";

export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("Get information about a user")
        .addUserOption(option => 
            option.setName("user")
                .setDescription("The user to get info about")
                .setRequired(false)
        ),
    
    options: {
        cooldown: 5,
        aliases: ["whois", "user"],
        category: "Utility"
    },
    
    execute: async (cmdExecutor) => {
        const targetUser = cmdExecutor.getUser("user") || cmdExecutor.getAuthor;
        
        const embed = new EmbedBuilder()
            .setTitle(`User Info - ${targetUser.tag}`)
            .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
            .addFields(
                { name: "Username", value: targetUser.username, inline: true },
                { name: "User ID", value: targetUser.id, inline: true },
                { name: "Account Created", value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setColor(0x3498db)
            .setFooter({ text: `Requested by ${cmdExecutor.getAuthor.tag}` })
            .setTimestamp();
            
        await cmdExecutor.reply({ embeds: [embed] });
    }
});

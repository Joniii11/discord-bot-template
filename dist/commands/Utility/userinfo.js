import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";
export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("userinfo")
        .setDescription("Get information about a user")
        .addUserOption(option => option.setName("user")
        .setDescription("The user to get info about")
        .setRequired(false)),
    options: {
        cooldown: 5,
        aliases: ["whois", "user"],
        category: "Utility"
    },
    execute: async (cmdExecutor) => {
        const { client } = cmdExecutor;
        const targetUser = cmdExecutor.getUser("user") || cmdExecutor.getAuthor;
        // Get user's locale or default to English
        const locale = cmdExecutor.isInteraction()
            ? cmdExecutor.interaction.locale
            : "en-US";
        const embed = new EmbedBuilder()
            .setTitle(client.manager.t({
            key: "commands.userinfo.title",
            locale,
            replacements: { username: targetUser.tag }
        }))
            .setThumbnail(targetUser.displayAvatarURL({ size: 256 }))
            .addFields({
            name: client.manager.t({ key: "commands.userinfo.fields.username", locale }),
            value: targetUser.username,
            inline: true
        }, {
            name: client.manager.t({ key: "commands.userinfo.fields.userId", locale }),
            value: targetUser.id,
            inline: true
        }, {
            name: client.manager.t({ key: "commands.userinfo.fields.createdAt", locale }),
            value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:R>`,
            inline: true
        })
            .setColor(0x3498db)
            .setFooter({
            text: client.manager.t({
                key: "commands.userinfo.footer",
                locale,
                replacements: { username: cmdExecutor.getAuthor.tag }
            })
        })
            .setTimestamp();
        await cmdExecutor.reply({ embeds: [embed] });
    }
});

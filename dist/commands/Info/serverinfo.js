import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { commandFile } from "../../utils/types/commandManager.js";
export const data = commandFile({
    data: new SlashCommandBuilder()
        .setName("serverinfo")
        .setDescription("Get information about the server"),
    execute: async (cmdExecutor) => {
        const { client } = cmdExecutor;
        // Use type guard pattern for both message and interaction
        const guild = cmdExecutor.isMessage()
            ? cmdExecutor.message.guild
            : (cmdExecutor.isInteraction() ? cmdExecutor.interaction.guild : null);
        if (!guild) {
            const dmErrorMsg = client.manager.t({ key: "errors.guildOnly" });
            return cmdExecutor.reply(dmErrorMsg);
        }
        // Fix the locale retrieval to properly use the type guard
        const locale = cmdExecutor.isInteraction()
            ? cmdExecutor.interaction.locale
            : "en-US";
        // Translate embed titles and fields using new object parameter format
        const embed = new EmbedBuilder()
            .setColor("Blue")
            .setTitle(client.manager.t({ key: "commands.serverinfo.title", locale }))
            .addFields([
            {
                name: client.manager.t({ key: "commands.serverinfo.fields.members", locale }),
                value: guild.memberCount.toString(),
                inline: true
            },
            {
                name: client.manager.t({ key: "commands.serverinfo.fields.channels", locale }),
                value: guild.channels.cache.size.toString(),
                inline: true
            },
            {
                name: client.manager.t({ key: "commands.serverinfo.fields.roles", locale }),
                value: guild.roles.cache.size.toString(),
                inline: true
            },
            {
                name: client.manager.t({ key: "commands.serverinfo.fields.owner", locale }),
                value: `<@${guild.ownerId}>`,
                inline: true
            }
        ])
            .setFooter({
            text: client.manager.t({
                key: "commands.serverinfo.footer",
                locale,
                replacements: {
                    date: new Date(guild.createdTimestamp).toLocaleDateString(locale)
                }
            })
        });
        await cmdExecutor.reply({ embeds: [embed] });
    }
});

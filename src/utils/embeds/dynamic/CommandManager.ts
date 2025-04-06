import { ApplicationCommandOptionType, Colors, EmbedBuilder, RestOrArray } from "discord.js";

import DiscordBot from "../../structures/DiscordBot.js";
import { MissingArguments } from "../../types/commandManager.js";

export function noCommandFound(client: DiscordBot, commandName: string, lookALikeCommand: string[]) {
    const embed = new EmbedBuilder()
    .setColor(Colors.Red)
    .setTitle("❌ Command Not Found")
    .setDescription(
        `I couldn't find the command \`${commandName}\`. ${
            !lookALikeCommand || lookALikeCommand.length === 0
                ? ""
                : `Did you mean \`${lookALikeCommand[0]}\`?`
        }`
    )
    .setFooter({
        iconURL: client.user?.avatarURL() ?? undefined,
        text: client.user?.username ?? "Made by Joniii",
    })
    .setThumbnail(client.user?.avatarURL() ?? "")
    .setTimestamp();

    return embed;
};
export function youAreCooldowned(client: DiscordBot, remaining: number) {
    const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle(":x: You are on cooldown!")
        .setDescription(`You need to wait **${remaining} seconds** before you can use this command again.`)
        .setFooter({
            iconURL: client.user?.avatarURL() ?? undefined,
            text: client.user?.username ?? "Made by Joniii",
        })
        .setThumbnail(client.user?.avatarURL() ?? "")
        .setTimestamp()
        .addFields(
            { name: "Please be patient!", value: "Try again later.", inline: true }
        )

    return embed;
}

export function missingArgumentsEmbed(client: DiscordBot, missingArguments: MissingArguments[]): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle(":x: Missing Required Arguments")
        .setDescription("It seems you've forgotten to provide some necessary arguments.")
        .addFields(missingArguments.map(arg => ({
            name: `Missing Argument: \`${arg.name}\``,
            value: `Type: \`${LOOKUP_TABLE[arg.type]}\``,
            inline: true,
        })))
        .setFooter({
            iconURL: client.user?.avatarURL() ?? undefined,
            text: client.user?.username ?? "Made by Joniii",
        })
        .setThumbnail(client.user?.avatarURL() ?? null)
        .setTimestamp();

    return embed;
}

const LOOKUP_TABLE: { [key in ApplicationCommandOptionType]: string } = {
    [ApplicationCommandOptionType.String]: "Text",
    [ApplicationCommandOptionType.Number]: "Number",
    [ApplicationCommandOptionType.Boolean]: "Boolean",
    [ApplicationCommandOptionType.User]: "User",
    [ApplicationCommandOptionType.Channel]: "Channel",
    [ApplicationCommandOptionType.Role]: "Role",
    [ApplicationCommandOptionType.Mentionable]: "Mentionable",
    [ApplicationCommandOptionType.Attachment]: "Attachment",
    [ApplicationCommandOptionType.Integer]: "Integer",
    [ApplicationCommandOptionType.Subcommand]: "Subcommand",
    [ApplicationCommandOptionType.SubcommandGroup]: "Subcommand Group"
};
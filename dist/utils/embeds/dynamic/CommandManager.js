import { ApplicationCommandOptionType, Colors, EmbedBuilder } from "discord.js";
export function noCommandFound(client, commandName, lookALikeCommand) {
    const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Command Not Found")
        .setDescription(`I couldn't find the command \`${commandName}\`. ${!lookALikeCommand || lookALikeCommand.length === 0
        ? ""
        : `Did you mean \`${lookALikeCommand[0]}\`?`}`)
        .setFooter({
        iconURL: client.user?.avatarURL() ?? undefined,
        text: client.user?.username ?? "Made by Joniii",
    })
        .setThumbnail(client.user?.avatarURL() ?? "")
        .setTimestamp();
    return embed;
}
;
export function youAreCooldowned(client, remaining) {
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
        .addFields({ name: "Please be patient!", value: "Try again later.", inline: true });
    return embed;
}
export function missingArgumentsEmbed(client, missingArguments) {
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
const LOOKUP_TABLE = {
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

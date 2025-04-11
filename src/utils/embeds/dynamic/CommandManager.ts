import { ApplicationCommandOptionType, Colors, EmbedBuilder, Collection, CommandInteractionOption } from "discord.js";
import DiscordBot from "../../structures/DiscordBot.js";
import { MissingArguments, BaseCommand } from "../../types/commandManager.js";

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

export function permissionDeniedEmbed(client: DiscordBot, reason: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle("❌ Permission Denied")
        .setDescription(reason)
        .setFooter({
            iconURL: client.user?.avatarURL() ?? undefined,
            text: client.user?.username ?? "Made by Joniii",
        })
        .setTimestamp();
}

export function commandHelpEmbed(client: DiscordBot, command: BaseCommand): EmbedBuilder {
    const options = command.data.toJSON().options || [];
    
    const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(`Command: ${command.data.name}`)
        .setDescription(command.data.description)
        .setFooter({
            iconURL: client.user?.avatarURL() ?? undefined,
            text: client.user?.username ?? "Made by Joniii",
        })
        .setTimestamp();
    
    if (command.options?.aliases?.length) {
        embed.addFields({ name: "Aliases", value: command.options.aliases.map(a => `\`${a}\``).join(", "), inline: true });
    }
    
    if (command.options?.cooldown) {
        embed.addFields({ name: "Cooldown", value: `${command.options.cooldown} seconds`, inline: true });
    }
    
    embed.addFields({ name: "Category", value: command.options?.category || "Uncategorized", inline: true });
    
    if (options.length > 0) {
        const requiredOptions = options.filter(opt => opt.required);
        const optionalOptions = options.filter(opt => !opt.required);
        
        if (requiredOptions.length > 0) {
            const requiredText = requiredOptions.map(opt => 
                `\`${opt.name}\` (${LOOKUP_TABLE[opt.type]}): ${opt.description}`
            ).join('\n');
            embed.addFields({ name: "Required Arguments", value: requiredText });
        }
        
        if (optionalOptions.length > 0) {
            const optionalText = optionalOptions.map(opt => 
                `\`${opt.name}\` (${LOOKUP_TABLE[opt.type]}): ${opt.description}`
            ).join('\n');
            embed.addFields({ name: "Optional Arguments", value: optionalText });
        }
    }
    
    return embed;
}

/**
 * Creates an embed listing available commands
 * @param client - The Discord bot client
 * @param commands - Collection of commands to display
 * @param category - Optional category filter
 * @returns An embed with a list of commands
 */
export function commandListEmbed(
    client: DiscordBot, 
    commands: Collection<string, BaseCommand> | Map<string, BaseCommand>,
    category?: string
): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(category ? `${category} Commands` : 'All Commands')
        .setFooter({
            iconURL: client.user?.avatarURL() ?? undefined,
            text: `Use ${client.config.prefix}help [command] for details about a command`,
        })
        .setTimestamp();
    
    // Filter by category if specified
    const filteredCommands = category 
        ? Array.from(commands.values()).filter(cmd => cmd.options?.category === category)
        : Array.from(commands.values());
    
    if (filteredCommands.length === 0) {
        embed.setDescription("No commands found in this category.");
        return embed;
    }
    
    const commandList = filteredCommands.map(cmd => {
        return `\`${cmd.data.name}\` - ${cmd.data.description}`;
    }).join('\n');
    
    embed.setDescription(commandList);
    return embed;
}

/**
 * Creates a success embed with a custom message
 * @param client - The Discord bot client 
 * @param title - Success message title
 * @param description - Success message description
 * @returns A success embed
 */
export function successEmbed(client: DiscordBot, title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.Green)
        .setTitle(`✅ ${title}`)
        .setDescription(description)
        .setFooter({
            iconURL: client.user?.avatarURL() ?? undefined,
            text: client.user?.username ?? "Made by Joniii",
        })
        .setTimestamp();
}

/**
 * Creates an error embed with a custom message
 * @param client - The Discord bot client
 * @param title - Error message title
 * @param description - Error message description
 * @returns An error embed
 */
export function errorEmbed(client: DiscordBot, title: string, description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle(`❌ ${title}`)
        .setDescription(description)
        .setFooter({
            iconURL: client.user?.avatarURL() ?? undefined,
            text: client.user?.username ?? "Made by Joniii",
        })
        .setTimestamp();
}

/**
 * Creates an embed showing categories of commands
 * @param client - The Discord bot client
 * @param categories - List of command categories
 * @returns An embed showing command categories
 */
export function categoriesEmbed(client: DiscordBot, categories: string[]): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle("Command Categories")
        .setDescription(
            `Use \`${client.config.prefix}help <category>\` to view commands in a category.\n\n` +
            categories.map(c => `• **${c}**`).join('\n')
        )
        .setFooter({
            iconURL: client.user?.avatarURL() ?? undefined,
            text: client.user?.username ?? "Made by Joniii",
        })
        .setTimestamp();
}

/**
 * Creates an embed for command statistics/usage
 * @param client - The Discord bot client
 * @param command - The command name
 * @param usageCount - Number of times the command has been used
 * @param mostActiveUser - Most active user of the command
 * @returns An embed showing command usage statistics
 */
export function commandStatsEmbed(
    client: DiscordBot, 
    command: string,
    usageCount: number,
    mostActiveUser?: { id: string, count: number }
): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(Colors.Gold)
        .setTitle(`Command Statistics: ${command}`)
        .addFields(
            { name: "Times Used", value: usageCount.toString(), inline: true },
            { name: "Global Rank", value: "#1", inline: true } // This would be dynamic in a real implementation
        )
        .setFooter({
            iconURL: client.user?.avatarURL() ?? undefined,
            text: client.user?.username ?? "Made by Joniii",
        })
        .setTimestamp();
        
    if (mostActiveUser) {
        embed.addFields({ 
            name: "Most Active User", 
            value: `<@${mostActiveUser.id}> (${mostActiveUser.count} uses)`,
            inline: true
        });
    }
    
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
import { ApplicationCommandOptionType, Colors, EmbedBuilder } from "discord.js";
export function noCommandFound(client, commandName, lookALikeCommand) {
    const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle(client.manager.t({ key: "embeds.commandManager.noCommandFound.title" }))
        .setDescription(client.manager.t({
        key: "embeds.commandManager.noCommandFound.description",
        replacements: {
            command: commandName,
            suggestion: (!lookALikeCommand || lookALikeCommand.length === 0)
                ? ""
                : client.manager.t({
                    key: "embeds.commandManager.noCommandFound.suggestion",
                    replacements: { command: lookALikeCommand[0] }
                })
        }
    }))
        .setFooter({
        iconURL: client.user?.avatarURL() ?? undefined,
        text: client.user?.username ?? "Made by Joniii",
    })
        .setThumbnail(client.user?.avatarURL() ?? "")
        .setTimestamp();
    return embed;
}
export function youAreCooldowned(client, remaining) {
    const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle(client.manager.t({ key: "embeds.commandManager.cooldown.title" }))
        .setDescription(client.manager.t({
        key: "embeds.commandManager.cooldown.description",
        replacements: { seconds: remaining.toString() }
    }))
        .setFooter({
        iconURL: client.user?.avatarURL() ?? undefined,
        text: client.user?.username ?? "Made by Joniii",
    })
        .setThumbnail(client.user?.avatarURL() ?? "")
        .setTimestamp()
        .addFields({
        name: client.manager.t({ key: "embeds.commandManager.cooldown.fieldName" }),
        value: client.manager.t({ key: "embeds.commandManager.cooldown.fieldValue" }),
        inline: true
    });
    return embed;
}
export function missingArgumentsEmbed(client, missingArguments) {
    const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle(client.manager.t({ key: "embeds.commandManager.missingArguments.title" }))
        .setDescription(client.manager.t({ key: "embeds.commandManager.missingArguments.description" }))
        .addFields(missingArguments.map(arg => ({
        name: client.manager.t({
            key: "embeds.commandManager.missingArguments.argName",
            replacements: { name: arg.name }
        }),
        value: client.manager.t({
            key: "embeds.commandManager.missingArguments.argType",
            replacements: { type: LOOKUP_TABLE[arg.type] }
        }),
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
export function permissionDeniedEmbed(client, reason) {
    return new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle(client.manager.t({ key: "embeds.commandManager.permissionDenied.title" }))
        .setDescription(reason)
        .setFooter({
        iconURL: client.user?.avatarURL() ?? undefined,
        text: client.user?.username ?? "Made by Joniii",
    })
        .setTimestamp();
}
export function commandHelpEmbed(client, command) {
    const options = command.data.toJSON().options || [];
    const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(client.manager.t({ key: "embeds.commandManager.commandHelp.title", replacements: { command: command.data.name } }))
        .setDescription(command.data.description)
        .setFooter({
        iconURL: client.user?.avatarURL() ?? undefined,
        text: client.user?.username ?? "Made by Joniii",
    })
        .setTimestamp();
    if (command.options?.aliases?.length) {
        embed.addFields({
            name: client.manager.t({ key: "embeds.commandManager.commandHelp.aliases" }),
            value: command.options.aliases.map(a => `\`${a}\``).join(", "),
            inline: true
        });
    }
    if (command.options?.cooldown) {
        embed.addFields({
            name: client.manager.t({ key: "embeds.commandManager.commandHelp.cooldown" }),
            value: `${command.options.cooldown} seconds`,
            inline: true
        });
    }
    embed.addFields({
        name: client.manager.t({ key: "embeds.commandManager.commandHelp.category" }),
        value: command.options?.category || client.manager.t({ key: "embeds.commandManager.commandHelp.uncategorized" }),
        inline: true
    });
    if (options.length > 0) {
        const requiredOptions = options.filter(opt => opt.required);
        const optionalOptions = options.filter(opt => !opt.required);
        if (requiredOptions.length > 0) {
            const requiredText = requiredOptions.map(opt => `\`${opt.name}\` (${LOOKUP_TABLE[opt.type]}): ${opt.description}`).join('\n');
            embed.addFields({
                name: client.manager.t({ key: "embeds.commandManager.commandHelp.requiredArguments" }),
                value: requiredText
            });
        }
        if (optionalOptions.length > 0) {
            const optionalText = optionalOptions.map(opt => `\`${opt.name}\` (${LOOKUP_TABLE[opt.type]}): ${opt.description}`).join('\n');
            embed.addFields({
                name: client.manager.t({ key: "embeds.commandManager.commandHelp.optionalArguments" }),
                value: optionalText
            });
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
export function commandListEmbed(client, commands, category) {
    const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(category
        ? client.manager.t({ key: "embeds.commandManager.commandList.categoryTitle", replacements: { category } })
        : client.manager.t({ key: "embeds.commandManager.commandList.allCommandsTitle" }))
        .setFooter({
        iconURL: client.user?.avatarURL() ?? undefined,
        text: client.manager.t({ key: "embeds.commandManager.commandList.footer", replacements: { prefix: client.config.prefix } }),
    })
        .setTimestamp();
    // Filter by category if specified
    const filteredCommands = category
        ? Array.from(commands.values()).filter(cmd => cmd.options?.category === category)
        : Array.from(commands.values());
    if (filteredCommands.length === 0) {
        embed.setDescription(client.manager.t({ key: "embeds.commandManager.commandList.noCommands" }));
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
export function successEmbed(client, title, description) {
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
export function errorEmbed(client, title, description) {
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
export function categoriesEmbed(client, categories) {
    return new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(client.manager.t({ key: "embeds.commandManager.categories.title" }))
        .setDescription(client.manager.t({ key: "embeds.commandManager.categories.description", replacements: { prefix: client.config.prefix } }) +
        categories.map(c => `• **${c}**`).join('\n'))
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
export function commandStatsEmbed(client, command, usageCount, mostActiveUser) {
    const embed = new EmbedBuilder()
        .setColor(Colors.Gold)
        .setTitle(client.manager.t({ key: "embeds.commandManager.commandStats.title", replacements: { command } }))
        .addFields({
        name: client.manager.t({ key: "embeds.commandManager.commandStats.timesUsed" }),
        value: usageCount.toString(),
        inline: true
    }, {
        name: client.manager.t({ key: "embeds.commandManager.commandStats.globalRank" }),
        value: "#1", // This would be dynamic in a real implementation
        inline: true
    })
        .setFooter({
        iconURL: client.user?.avatarURL() ?? undefined,
        text: client.user?.username ?? "Made by Joniii",
    })
        .setTimestamp();
    if (mostActiveUser) {
        embed.addFields({
            name: client.manager.t({ key: "embeds.commandManager.commandStats.mostActiveUser" }),
            value: `<@${mostActiveUser.id}> (${mostActiveUser.count} uses)`,
            inline: true
        });
    }
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

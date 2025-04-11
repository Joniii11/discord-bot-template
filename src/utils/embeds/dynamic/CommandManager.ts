import { ApplicationCommandOptionType, Colors, EmbedBuilder, Collection, CommandInteractionOption } from "discord.js";
import DiscordBot from "../../structures/DiscordBot.js";
import { MissingArguments, BaseCommand } from "../../types/commandManager.js";

// Fallback translations for critical messages
const FALLBACKS = {
    permissionDenied: {
        title: "Permission Denied"
    },
    noCommandFound: {
        title: "Command Not Found",
        description: "I couldn't find the command '{command}'.",
        suggestion: "Did you mean '{command}'?"
    },
    cooldown: {
        title: "You are on cooldown!",
        description: "You need to wait {seconds} seconds before you can use this command again.",
        fieldName: "Please be patient!",
        fieldValue: "Try again later."
    },
    missingArguments: {
        title: "Missing Required Arguments",
        description: "It seems you've forgotten to provide some necessary arguments.",
        argName: "Missing Argument: {name}",
        argType: "Type: {type}"
    },
    commandHelp: {
        title: "Command Help: {command}",
        aliases: "Aliases",
        cooldown: "Cooldown",
        category: "Category",
        uncategorized: "Uncategorized",
        requiredArguments: "Required Arguments",
        optionalArguments: "Optional Arguments"
    },
    commandList: {
        categoryTitle: "{category} Commands",
        allCommandsTitle: "All Commands",
        footer: "Use {prefix}help [command] for details about a command",
        noCommands: "No commands found in this category."
    },
    categories: {
        title: "Command Categories",
        description: "Use {prefix}help <category> to view commands in a category.\n\n"
    },
    commandStats: {
        title: "Stats for {command}",
        timesUsed: "Times Used",
        globalRank: "Global Rank",
        mostActiveUser: "Most Active User"
    }
};

/**
 * Helper function that attempts to translate text but falls back to English if translation fails
 * @param client - Discord bot client
 * @param key - Translation key
 * @param replacements - Optional replacements for variables
 * @param fallback - Fallback text if translation fails
 * @returns Translated text or fallback
 */
function translateWithFallback(
    client: DiscordBot, 
    key: string, 
    replacements?: Record<string, string>,
    fallback?: string
): string {
    try {
        // Try to use the translation system
        if (client.manager.localeManager?.isEnabled() && client.manager.t) {
            return client.manager.t({ key, replacements });
        }
    } catch (error) {
        console.warn(`Translation failed for key: ${key}`);
    }
    
    // Return the fallback text if translation fails or is disabled
    if (fallback) {
        // Apply replacements to fallback text if provided
        let result = fallback;
        if (replacements) {
            for (const [key, value] of Object.entries(replacements)) {
                result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
            }
        }
        return result;
    }
    
    return key;
}

export function noCommandFound(client: DiscordBot, commandName: string, lookALikeCommand: string[]) {
    const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle(translateWithFallback(
            client, 
            "embeds.commandManager.noCommandFound.title",
            {},
            FALLBACKS.noCommandFound.title
        ))
        .setDescription(
            translateWithFallback(
                client,
                "embeds.commandManager.noCommandFound.description",
                {
                    command: commandName,
                    suggestion: (!lookALikeCommand || lookALikeCommand.length === 0) 
                        ? "" 
                        : translateWithFallback(
                            client,
                            "embeds.commandManager.noCommandFound.suggestion",
                            { command: lookALikeCommand[0] },
                            FALLBACKS.noCommandFound.suggestion
                        )
                },
                FALLBACKS.noCommandFound.description
            )
        )
        .setFooter({
            iconURL: client.user?.avatarURL() ?? undefined,
            text: client.user?.username ?? "Made by Joniii",
        })
        .setThumbnail(client.user?.avatarURL() ?? "")
        .setTimestamp();

    return embed;
}

export function youAreCooldowned(client: DiscordBot, remaining: number) {
    const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle(translateWithFallback(
            client,
            "embeds.commandManager.cooldown.title",
            {},
            FALLBACKS.cooldown.title
        ))
        .setDescription(translateWithFallback(
            client,
            "embeds.commandManager.cooldown.description",
            { seconds: remaining.toString() },
            FALLBACKS.cooldown.description
        ))
        .setFooter({
            iconURL: client.user?.avatarURL() ?? undefined,
            text: client.user?.username ?? "Made by Joniii",
        })
        .setThumbnail(client.user?.avatarURL() ?? "")
        .setTimestamp()
        .addFields({
            name: translateWithFallback(
                client,
                "embeds.commandManager.cooldown.fieldName",
                {},
                FALLBACKS.cooldown.fieldName
            ),
            value: translateWithFallback(
                client,
                "embeds.commandManager.cooldown.fieldValue",
                {},
                FALLBACKS.cooldown.fieldValue
            ),
            inline: true
        });

    return embed;
}

export function missingArgumentsEmbed(client: DiscordBot, missingArguments: MissingArguments[]): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTitle(translateWithFallback(
            client,
            "embeds.commandManager.missingArguments.title",
            {},
            FALLBACKS.missingArguments.title
        ))
        .setDescription(translateWithFallback(
            client,
            "embeds.commandManager.missingArguments.description",
            {},
            FALLBACKS.missingArguments.description
        ))
        .addFields(missingArguments.map(arg => ({
            name: translateWithFallback(
                client,
                "embeds.commandManager.missingArguments.argName",
                { name: arg.name },
                FALLBACKS.missingArguments.argName
            ),
            value: translateWithFallback(
                client,
                "embeds.commandManager.missingArguments.argType",
                { type: LOOKUP_TABLE[arg.type] },
                FALLBACKS.missingArguments.argType
            ),
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
        .setTitle(translateWithFallback(
            client, 
            "embeds.commandManager.permissionDenied.title", 
            {}, 
            FALLBACKS.permissionDenied.title
        ))
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
        .setTitle(translateWithFallback(
            client,
            "embeds.commandManager.commandHelp.title",
            { command: command.data.name },
            FALLBACKS.commandHelp.title
        ))
        .setDescription(command.data.description)
        .setFooter({
            iconURL: client.user?.avatarURL() ?? undefined,
            text: client.user?.username ?? "Made by Joniii",
        })
        .setTimestamp();
    
    if (command.options?.aliases?.length) {
        embed.addFields({ 
            name: translateWithFallback(
                client,
                "embeds.commandManager.commandHelp.aliases",
                {},
                FALLBACKS.commandHelp.aliases
            ), 
            value: command.options.aliases.map(a => `\`${a}\``).join(", "), 
            inline: true 
        });
    }
    
    if (command.options?.cooldown) {
        embed.addFields({ 
            name: translateWithFallback(
                client,
                "embeds.commandManager.commandHelp.cooldown",
                {},
                FALLBACKS.commandHelp.cooldown
            ), 
            value: `${command.options.cooldown} seconds`, 
            inline: true 
        });
    }
    
    embed.addFields({ 
        name: translateWithFallback(
            client,
            "embeds.commandManager.commandHelp.category",
            {},
            FALLBACKS.commandHelp.category
        ), 
        value: command.options?.category || translateWithFallback(
            client,
            "embeds.commandManager.commandHelp.uncategorized",
            {},
            FALLBACKS.commandHelp.uncategorized
        ), 
        inline: true 
    });
    
    if (options.length > 0) {
        const requiredOptions = options.filter(opt => opt.required);
        const optionalOptions = options.filter(opt => !opt.required);
        
        if (requiredOptions.length > 0) {
            const requiredText = requiredOptions.map(opt => 
                `\`${opt.name}\` (${LOOKUP_TABLE[opt.type]}): ${opt.description}`
            ).join('\n');
            embed.addFields({ 
                name: translateWithFallback(
                    client,
                    "embeds.commandManager.commandHelp.requiredArguments",
                    {},
                    FALLBACKS.commandHelp.requiredArguments
                ), 
                value: requiredText 
            });
        }
        
        if (optionalOptions.length > 0) {
            const optionalText = optionalOptions.map(opt => 
                `\`${opt.name}\` (${LOOKUP_TABLE[opt.type]}): ${opt.description}`
            ).join('\n');
            embed.addFields({ 
                name: translateWithFallback(
                    client,
                    "embeds.commandManager.commandHelp.optionalArguments",
                    {},
                    FALLBACKS.commandHelp.optionalArguments
                ), 
                value: optionalText 
            });
        }
    }
    
    return embed;
}

export function commandListEmbed(
    client: DiscordBot, 
    commands: Collection<string, BaseCommand> | Map<string, BaseCommand>,
    category?: string
): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(category 
            ? translateWithFallback(
                client,
                "embeds.commandManager.commandList.categoryTitle",
                { category },
                FALLBACKS.commandList.categoryTitle
              )
            : translateWithFallback(
                client,
                "embeds.commandManager.commandList.allCommandsTitle",
                {},
                FALLBACKS.commandList.allCommandsTitle
              )
        )
        .setFooter({
            iconURL: client.user?.avatarURL() ?? undefined,
            text: translateWithFallback(
                client,
                "embeds.commandManager.commandList.footer",
                { prefix: client.config.prefix },
                FALLBACKS.commandList.footer
            ),
        })
        .setTimestamp();
    
    // Filter by category if specified
    const filteredCommands = category 
        ? Array.from(commands.values()).filter(cmd => cmd.options?.category === category)
        : Array.from(commands.values());
    
    if (filteredCommands.length === 0) {
        embed.setDescription(translateWithFallback(
            client,
            "embeds.commandManager.commandList.noCommands",
            {},
            FALLBACKS.commandList.noCommands
        ));
        return embed;
    }
    
    const commandList = filteredCommands.map(cmd => {
        return `\`${cmd.data.name}\` - ${cmd.data.description}`;
    }).join('\n');
    
    embed.setDescription(commandList);
    return embed;
}

export function categoriesEmbed(client: DiscordBot, categories: string[]): EmbedBuilder {
    return new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(translateWithFallback(
            client,
            "embeds.commandManager.categories.title",
            {},
            FALLBACKS.categories.title
        ))
        .setDescription(
            translateWithFallback(
                client,
                "embeds.commandManager.categories.description",
                { prefix: client.config.prefix },
                FALLBACKS.categories.description
            ) +
            categories.map(c => `• **${c}**`).join('\n')
        )
        .setFooter({
            iconURL: client.user?.avatarURL() ?? undefined,
            text: client.user?.username ?? "Made by Joniii",
        })
        .setTimestamp();
}

export function commandStatsEmbed(
    client: DiscordBot, 
    command: string,
    usageCount: number,
    mostActiveUser?: { id: string, count: number }
): EmbedBuilder {
    const embed = new EmbedBuilder()
        .setColor(Colors.Gold)
        .setTitle(translateWithFallback(
            client,
            "embeds.commandManager.commandStats.title",
            { command },
            FALLBACKS.commandStats.title
        ))
        .addFields(
            { 
                name: translateWithFallback(
                    client,
                    "embeds.commandManager.commandStats.timesUsed",
                    {},
                    FALLBACKS.commandStats.timesUsed
                ), 
                value: usageCount.toString(), 
                inline: true 
            },
            { 
                name: translateWithFallback(
                    client,
                    "embeds.commandManager.commandStats.globalRank",
                    {},
                    FALLBACKS.commandStats.globalRank
                ), 
                value: "#1", // This would be dynamic in a real implementation
                inline: true 
            }
        )
        .setFooter({
            iconURL: client.user?.avatarURL() ?? undefined,
            text: client.user?.username ?? "Made by Joniii",
        })
        .setTimestamp();
        
    if (mostActiveUser) {
        embed.addFields({ 
            name: translateWithFallback(
                client,
                "embeds.commandManager.commandStats.mostActiveUser",
                {},
                FALLBACKS.commandStats.mostActiveUser
            ), 
            value: `<@${mostActiveUser.id}> (${mostActiveUser.count} uses)`,
            inline: true
        });
    }
    
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
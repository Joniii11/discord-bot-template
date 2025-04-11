import { levenshteinDistanceDamerau } from "../algorithm.js";
import { 
    missingArgumentsEmbed, 
    noCommandFound, 
    youAreCooldowned,
    permissionDeniedEmbed 
} from "../embeds/dynamic/CommandManager.js";
import CommandExecutor, { ExecutorMode } from "../structures/CommandExecutor.js";
import DiscordBot from "../structures/DiscordBot.js"
import { BaseCommand, ImportedBaseCommand, MissingArguments } from "../types/commandManager.js";

import { readdir } from "node:fs/promises";
import CooldownManager from "./CooldownManager.js";
import { ApplicationCommandOptionType, EmbedBuilder, PermissionResolvable, GuildMember, PermissionsBitField } from "discord.js";

export default class CommandManager {
    private commands: Map<string, BaseCommand> = new Map()
    private client: DiscordBot

    public initialized = false;
    public cooldownManager: CooldownManager

    public constructor(client: DiscordBot) {
        this.client = client;
        this.cooldownManager = new CooldownManager(client)
    };

    public async init() {
        await this._loadCommands()
        this.initialized = true;
        this.client.logger.ready("Initialized the CommandManager.")
    }

    private async _loadCommands() {
        const commandFolder = await readdir("./dist/commands/");

        const readSubCommandDir = async (folder: string) => {
            const files = await readdir(`./dist/commands/${folder}/`);
            const promises = []

            for (const file of files) promises.push(this._loadFile(folder, file))

            await Promise.allSettled(promises)
        };

        const promises = [];
        for (const folder of commandFolder) promises.push(readSubCommandDir(folder))

        await Promise.allSettled(promises)
    };

    private async _loadFile(folder: string, file: string) {
        const loadedFile = await import(`./../../commands/${folder}/${file}`)
        if (!this.isCommand(loadedFile)) return;

        const commandData = {
            ...loadedFile.data,
            options: {
              ...loadedFile.data.options,
              category: loadedFile.data.options?.category 
                ? (loadedFile.data.options.category.startsWith("null") 
                    ? folder 
                    : loadedFile.data.options.category)
                : folder,
            }
        } as BaseCommand<ExecutorMode>

        this.commands.set(loadedFile.data.name, commandData);
    };

    public isCommand(command: any): command is ImportedBaseCommand {
        if (!command.data) return false;
        if (!command.data.name) return false;
        if (!command.data.data) return false;

        return true;
    };

    public async runCommand(commandExecutor: CommandExecutor<ExecutorMode>) {
        if (commandExecutor.getAuthor.bot) return;

        const { commandName, client, getAuthor } = commandExecutor;
        
        if (!commandName || commandName.trim() === "") return;
        
        const command = this.getCommand(commandName);
        if (!command) {
            const res = this.lookALikeCommand(commandName);
            const embeds = [noCommandFound(client, commandName, res)]

            if (commandExecutor.isInteraction()) return commandExecutor.reply({ embeds, flags: "Ephemeral"})
            else if (commandExecutor.isMessage()) return commandExecutor.reply({ embeds }).then((msg) => setTimeout(async () => msg.deletable ? msg.delete() : null, 15000));

            return;
        };
        
        if (commandExecutor.isMessage() && command.options?.slashOnly) return;

        if (command.options?.cooldown && command.options?.cooldown !== 0) {
            const isCooldowned = this.cooldownManager.applyCooldown(commandName, getAuthor.id, command.options.cooldown);

            if (isCooldowned.isCooldowned && commandExecutor.isInteraction()) return commandExecutor.reply(({ embeds: [youAreCooldowned(client, isCooldowned.remaining)], flags: "Ephemeral" }))
            else if (isCooldowned.isCooldowned && commandExecutor.isMessage()) return commandExecutor.reply({ embeds: [youAreCooldowned(client, isCooldowned.remaining)] }).then((msg) => setTimeout(async () => msg.deletable ? msg.delete() : null, 15000));
        };

        // Check permissions before executing
        const permissionResult = await this.checkPermissions(command, commandExecutor);
        if (permissionResult !== true) {
            return commandExecutor.reply({ 
                embeds: [permissionDeniedEmbed(client, permissionResult)], 
                ephemeral: true 
            });
        }

        if (commandExecutor.isMessage()) {
            if (await this.handleArgs(command, commandExecutor)) return;
        };

        return command.execute(commandExecutor);
    };

    private async checkPermissions(command: BaseCommand, cmdExecutor: CommandExecutor<ExecutorMode>): Promise<true | string> {
        if (!command.options?.permissions) return true;
        
        const { permissions } = command.options;
        
        // Owner only check
        if (permissions.ownerOnly && !this.client.config.ownerIds.includes(cmdExecutor.getAuthor.id)) {
            return "This command can only be used by the bot owner.";
        }
        
        // Guild only check
        if (permissions.guildOnly) {
            if (cmdExecutor.isMessage() && !cmdExecutor.message.guild) {
                return "This command can only be used in servers.";
            } else if (cmdExecutor.isInteraction() && !cmdExecutor.interaction.guild) {
                return "This command can only be used in servers.";
            }
        }
        
        // DM only check
        if (permissions.dmOnly) {
            if (cmdExecutor.isMessage() && cmdExecutor.message.guild) {
                return "This command can only be used in direct messages.";
            } else if (cmdExecutor.isInteraction() && cmdExecutor.interaction.guild) {
                return "This command can only be used in direct messages.";
            }
        }
        
        // Role checks
        if (permissions.roleIds && permissions.roleIds.length > 0) {
            let hasRole = false;
            
            if (cmdExecutor.isMessage() && cmdExecutor.message.guild) {
                const member = cmdExecutor.message.member;
                if (member && typeof member.roles !== 'string' && member.roles.cache) {
                    hasRole = member.roles.cache.some(r => 
                        permissions.roleIds!.includes(r.id)
                    );
                }
            } else if (cmdExecutor.isInteraction() && cmdExecutor.interaction.guild) {
                const member = cmdExecutor.interaction.member;
                if (member && typeof member !== 'string' && member instanceof GuildMember) {
                    hasRole = member.roles.cache.some(r => 
                        permissions.roleIds!.includes(r.id)
                    );
                }
            }
            
            if (!hasRole) {
                return "You don't have the required role to use this command.";
            }
        }
        
        // User permission checks
        if (permissions.userPermissions && permissions.userPermissions.length > 0) {
            let hasPermission = false;
            
            if (cmdExecutor.isMessage() && cmdExecutor.message.guild) {
                const member = cmdExecutor.message.member;
                if (member && member.permissions instanceof PermissionsBitField) {
                    hasPermission = member.permissions.has(
                        permissions.userPermissions as PermissionResolvable
                    );
                }
            } else if (cmdExecutor.isInteraction() && cmdExecutor.interaction.guild) {
                const member = cmdExecutor.interaction.member;
                if (member && typeof member !== 'string' && member instanceof GuildMember) {
                    hasPermission = member.permissions.has(
                        permissions.userPermissions as PermissionResolvable
                    );
                }
            }
            
            if (!hasPermission) {
                return `You need the following permissions to use this command: ${permissions.userPermissions.join(", ")}`;
            }
        }
        
        // Bot permission checks
        if (permissions.botPermissions && permissions.botPermissions.length > 0) {
            let hasPermission = false;
            
            if (cmdExecutor.isMessage() && cmdExecutor.message.guild) {
                const botMember = cmdExecutor.message.guild.members.me;
                if (botMember && botMember.permissions instanceof PermissionsBitField) {
                    hasPermission = botMember.permissions.has(
                        permissions.botPermissions as PermissionResolvable
                    );
                }
            } else if (cmdExecutor.isInteraction() && cmdExecutor.interaction.guild) {
                const botMember = cmdExecutor.interaction.guild.members.me;
                if (botMember && botMember.permissions instanceof PermissionsBitField) {
                    hasPermission = botMember.permissions.has(
                        permissions.botPermissions as PermissionResolvable
                    );
                }
            }
            
            if (!hasPermission) {
                return `I need the following permissions to execute this command: ${permissions.botPermissions.join(", ")}`;
            }
        }
        
        return true;
    }

    public get getCommands() {
        return this.commands;
    };

    public getCommand(commandName: string) {
        const command = this.commands.get(commandName);
        if (command) return command;

        const allCommands = this.commands.entries();

        for (const cmd of allCommands) {
            if (cmd[1].options?.aliases && !cmd[1].options?.slashOnly && cmd[1].options.aliases.length !== 0 && cmd[1].options.aliases.includes(commandName)) return cmd[1];
            continue;
        };

        return undefined;
    };

    /**
     * Returns commands that look like it
     * @param cmdName 
     * @returns 
     */
    public lookALikeCommand(cmdName: string): string[] {
        if (cmdName.length > 10) return [];
        
        const commands = this.getCommands;
        const candidates: {name: string, distance: number}[] = [];
        
        for (const [command] of commands) {
            const distance = levenshteinDistanceDamerau(command, cmdName);
            if (distance <= 2) { // Threshold
                candidates.push({ name: command, distance });
            }
        }
        
        const candidate = candidates
            .sort((a, b) => a.distance - b.distance)
            .slice(0, 3)
            .map(c => c.name);

        return candidate
    };
    
    private async handleArgs(command: BaseCommand, commandExecutor: CommandExecutor<ExecutorMode>) {
        const commandArguments = command.data.toJSON().options;
        if (!commandArguments || commandArguments.length === 0 || !commandExecutor.isMessage()) {
            return false;
        }
        
        const processedArgs: Record<string, any> = {};
        const missingArguments: MissingArguments[] = [];
        
        let currentArgIndex = 0;
        const userArgs = commandExecutor.arguments || [];
        
        const requiredArgs = commandArguments.filter(arg => arg.required);
        const optionalArgs = commandArguments.filter(arg => !arg.required);
        const allArgsInOrder = [...requiredArgs, ...optionalArgs];
        
        for (const arg of allArgsInOrder) {
            if (currentArgIndex >= userArgs.length && !arg.required) {
                continue;
            }
            
            if (currentArgIndex >= userArgs.length && arg.required) {
                missingArguments.push({ type: arg.type, name: arg.name });
                continue;
            }
            
            const currentArg = userArgs[currentArgIndex];
            
            try {
                switch (arg.type) {
                    case ApplicationCommandOptionType.Boolean:
                        processedArgs[arg.name] = currentArg?.toLowerCase() === 'true' || 
                                                  currentArg?.toLowerCase() === 'yes' || 
                                                  currentArg === '1';
                        currentArgIndex++;
                        break;
                        
                    case ApplicationCommandOptionType.Channel:
                        const channelMatch = currentArg.match(/<#(\d+)>/);
                        const channelId = channelMatch ? channelMatch[1] : currentArg;
                        
                        const isValidChannelId = /^\d{17,20}$/.test(channelId);
                        const channel = isValidChannelId ? commandExecutor.client.channels.cache.get(channelId) : null;
                        
                        if (!channel && arg.required) {
                            missingArguments.push({ type: ApplicationCommandOptionType.Channel, name: arg.name });
                            currentArgIndex++;
                            continue;
                        }
                        
                        processedArgs[arg.name] = channelId;
                        currentArgIndex++;
                        break;
                        
                    case ApplicationCommandOptionType.Integer:
                    case ApplicationCommandOptionType.Number:
                        const numValue = Number(currentArg);
                        if (isNaN(numValue) && arg.required) {
                            missingArguments.push({ type: arg.type, name: arg.name });
                            currentArgIndex++;
                            continue;
                        }
                        
                        if ('min_value' in arg && numValue < arg.min_value!) {
                            missingArguments.push({ type: arg.type, name: arg.name });
                            currentArgIndex++;
                            continue;
                        }
                        
                        if ('max_value' in arg && numValue > arg.max_value!) {
                            missingArguments.push({ type: arg.type, name: arg.name });
                            currentArgIndex++;
                            continue;
                        }
                        
                        processedArgs[arg.name] = numValue;
                        currentArgIndex++;
                        break;
                        
                    case ApplicationCommandOptionType.String:
                        let stringValue: string;
                        const isLastRequiredArg = requiredArgs.indexOf(arg) === requiredArgs.length - 1;
                        
                        if (isLastRequiredArg && arg === allArgsInOrder[allArgsInOrder.length - 1]) {
                            stringValue = userArgs.slice(currentArgIndex).join(" ");
                            currentArgIndex = userArgs.length;
                        } else {
                            stringValue = currentArg;
                            currentArgIndex++;
                        }
                        
                        if (arg.choices && arg.choices.length > 0) {
                            const validChoices = arg.choices.map(c => c.value);
                            if (!validChoices.includes(stringValue.toLowerCase()) && arg.required) {
                                missingArguments.push({ 
                                    type: ApplicationCommandOptionType.String, 
                                    name: arg.name, 
                                    choices: { is: true, choices: arg.choices } 
                                });
                                continue;
                            }
                        }
                        
                        if ('max_length' in arg && stringValue.length > arg.max_length!) {
                            missingArguments.push({ 
                                type: ApplicationCommandOptionType.String, 
                                max_length: true, 
                                name: arg.name 
                            });
                            continue;
                        }
                        
                        if ('min_length' in arg && stringValue.length < arg.min_length!) {
                            missingArguments.push({ 
                                type: ApplicationCommandOptionType.String, 
                                min_length: true, 
                                name: arg.name 
                            });
                            continue;
                        }
                        
                        processedArgs[arg.name] = stringValue;
                        break;
                        
                    case ApplicationCommandOptionType.User:
                        const userMatch = currentArg.match(/<@!?(\d+)>/);
                        const userId = userMatch ? userMatch[1] : currentArg;
                        
                        const isValidUserId = /^\d{17,20}$/.test(userId);
                        let user = null;
                        
                        if (isValidUserId) {
                            try {
                                user = await commandExecutor.client.users.fetch(userId).catch(() => null);
                            } catch (err) {
                                // Failed to fetch user
                            }
                        }
                        
                        if (arg.required && !user) {
                            missingArguments.push({ type: arg.type, name: arg.name });
                            currentArgIndex++;
                            continue;
                        }
                        
                        processedArgs[arg.name] = userId;
                        currentArgIndex++;
                        break;
                        
                    case ApplicationCommandOptionType.Role:
                        const roleMatch = currentArg.match(/<@&(\d+)>/);
                        const roleId = roleMatch ? roleMatch[1] : currentArg;
                        
                        const isValidRoleId = /^\d{17,20}$/.test(roleId);
                        let role = null;
                        
                        if (isValidRoleId && commandExecutor.message?.guild) {
                            try {
                                role = await commandExecutor.message.guild.roles.fetch(roleId).catch(() => null);
                            } catch (err) {
                                // Failed to fetch role
                            }
                        }
                        
                        if (arg.required && !role) {
                            missingArguments.push({ type: arg.type, name: arg.name });
                            currentArgIndex++;
                            continue;
                        }
                        
                        processedArgs[arg.name] = roleId;
                        currentArgIndex++;
                        break;
                        
                    default:
                        currentArgIndex++;
                        continue;
                }
            } catch (error) {
                missingArguments.push({ type: arg.type, name: arg.name });
                currentArgIndex++;
                continue;
            }
        }
        
        if (missingArguments.length > 0) {
            return commandExecutor.reply({ embeds: [missingArgumentsEmbed(commandExecutor.client, missingArguments)] });
        }
        
        commandExecutor.parsedArgs = processedArgs;
        return false;
    }
}
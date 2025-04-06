import { levenshteinDistanceDamerau } from "../algorithm.js";
import { missingArgumentsEmbed, noCommandFound, youAreCooldowned } from "../embeds/dynamic/CommandManager.js";
import CommandExecutor, { ExecutorMode } from "../structures/CommandExecutor.js";
import DiscordBot from "../structures/DiscordBot.js"
import { BaseCommand, ImportedBaseCommand, MissingArguments } from "../types/commandManager.js";

import { readdir } from "node:fs/promises";
import CooldownManager from "./CooldownManager.js";
import { ApplicationCommandOptionType, ApplicationCommandType, ContextMenuCommandInteraction } from "discord.js";

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
        if (commandExecutor.getAuthor.bot) return console.log("is bot");

        const { commandName, client, getAuthor } = commandExecutor;
        const command = this.getCommand(commandName);
        if (!command) {
            const res = this.lookALikeCommand(commandName);
            const embeds = [noCommandFound(client, commandName, res)]

            console.log("couldn't find the commyndjkasdhbicoub-fdsa", commandName)

            if (commandExecutor.isInteraction()) return commandExecutor.reply({ embeds, flags: "Ephemeral"})
            else if (commandExecutor.isMessage()) return commandExecutor.reply({ embeds }).then((msg) => setTimeout(async () => msg.deletable ? msg.delete() : null, 15000));

            return;
        };

        if (command.options?.cooldown && command.options?.cooldown !== 0) {
            const isCooldowned = this.cooldownManager.applyCooldown(commandName, getAuthor.id, command.options.cooldown);

            console.log("snickers")

            if (isCooldowned.isCooldowned && commandExecutor.isInteraction()) return commandExecutor.reply(({ embeds: [youAreCooldowned(client, isCooldowned.remaining)], flags: "Ephemeral" }))
            else if (isCooldowned.isCooldowned && commandExecutor.isMessage()) return commandExecutor.reply({ embeds: [youAreCooldowned(client, isCooldowned.remaining)] }).then((msg) => setTimeout(async () => msg.deletable ? msg.delete() : null, 15000));
        };

        if (this.handleArgs(command, commandExecutor)) return console.log(("UWU"));

        console.log(("Shoulr dhahsidgvpai executed ASJOD"))
        return command.execute(commandExecutor)
    };

    public get getCommands() {
        return this.commands;
    };

    public getCommand(commandName: string) {
        const command = this.commands.get(commandName);
        if (command) return command;

        const allCommands = this.commands.entries();

        for (const cmd of allCommands) {
            if (cmd[1].options?.aliases && cmd[1].options.aliases.length !== 0 && cmd[1].options.aliases.includes(commandName)) return cmd[1];
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
    
    private handleArgs(command: BaseCommand, commandExecutor: CommandExecutor<ExecutorMode>) {
        const commandArguments = command.data.toJSON().options;
        if (!commandArguments || commandArguments.length === 0 || commandExecutor.isInteraction() || !commandExecutor.isMessage()) return false;
        
        const processedArguments: string[] = [];
        const missingArguments: MissingArguments[] = []

        let index = 1;
        let noMore = false;
        let required = true;

        for (const arg of commandArguments) {
            if (noMore) throw new TypeError(`YOU CAN ONLY HAVE ONE ARGUMENT OF TYPE STRING, sorry. To fix it make this command SlashCommandOnly BaseCommand.options.slashCommandOnly = true : ${command.name}`)

            const currentArg = commandExecutor.arguments[index];
            if (!currentArg) {
                missingArguments.push({ type: arg.type, name: arg.name });
                continue;
            };
            if (!arg.required) required = false;
            if (arg.required && !required) throw new TypeError(`FIX the order of the arguments you passed in for the command: ${command.name}`)

            switch (arg.type) {
                case ApplicationCommandOptionType.Boolean: {
                    const processedArgument = Boolean(currentArg);
                    
                    processedArguments.push(`${processedArgument}`);
                    continue;
                };

                /*case ApplicationCommandOptionType.SubcommandGroup:
                case ApplicationCommandOptionType.Subcommand: {
                    
                }*/

                case ApplicationCommandOptionType.Channel: {
                    const channelId = currentArg.replace(/<@#(\d+)>/, '$1');
                    if (!channelId && arg.required) {
                        missingArguments.push({ type: ApplicationCommandOptionType.Channel, name: arg.name });
                        continue;
                    };

                    processedArguments.push(`${channelId}`);
                    continue;
                };

                case ApplicationCommandOptionType.Number:
                case ApplicationCommandOptionType.Integer: {
                    const integer = isNaN(Number(currentArg));
                    if ((integer || typeof Number(currentArg) !== "number") && arg.required) {
                        missingArguments.push({ type: arg.type, name: arg.name });
                        continue;
                    }

                    processedArguments.push(currentArg);
                    continue;
                };

                case ApplicationCommandOptionType.String: {
                    const processedString = processedArguments.join(commandExecutor.arguments.slice(index).join(" "));

                    if (arg.choices && arg.choices.length !== 0) {
                        let wasIncluded = false;
                        
                        for (const choice of arg.choices) {
                            if (choice.value === processedString.trim().toLowerCase()) wasIncluded = true;
                        };

                        if (!wasIncluded)  {
                            missingArguments.push({ type: ApplicationCommandOptionType.String, name: arg.name, choices: { is: true, choices: arg.choices ?? [] } });
                            continue;
                        }
                    } else if (arg.max_length) {
                        if (arg.max_length < processedString.trim().length) {
                            missingArguments.push(({ type: ApplicationCommandOptionType.String, max_length: true, name: arg.name }))
                            continue;
                        }
                    } else if (arg.min_length) {
                        if (arg.min_length > processedString.trim().length) {
                            missingArguments.push({ type: ApplicationCommandOptionType.String, min_length: true, name: arg.name });
                            continue;
                        }
                    };

                    noMore = true;
                    continue;
                };

                case ApplicationCommandOptionType.User: {
                    const userId = currentArg.replace(/<@(\d+)>/, '$1');
                    if (!userId && arg.required) {
                        missingArguments.push({ type: arg.type, name: arg.name });
                        continue;
                    }

                    processedArguments.push(`${userId}`);
                    continue;
                };

                case ApplicationCommandOptionType.Role: {
                    const roleId = currentArg.replace(/<@&(\d+)>/, '$1');
                    if (!roleId && arg.required) {
                        missingArguments.push({ type: arg.type, name: arg.name });
                        continue;
                    }

                    processedArguments.push(`${roleId}`);
                    continue;
                };
            };

            index++;
        };

        if (missingArguments.length > 0) return commandExecutor.reply({ embeds: [missingArgumentsEmbed(commandExecutor.client, missingArguments)] });

        commandExecutor.arguments = processedArguments;

        return false;
    }
}
import { levenshteinDistanceDamerau } from "../algorithm.js";
import { missingArgumentsEmbed, noCommandFound, youAreCooldowned } from "../embeds/dynamic/CommandManager.js";
import { readdir } from "node:fs/promises";
import CooldownManager from "./CooldownManager.js";
import { ApplicationCommandOptionType } from "discord.js";
export default class CommandManager {
    commands = new Map();
    client;
    initialized = false;
    cooldownManager;
    constructor(client) {
        this.client = client;
        this.cooldownManager = new CooldownManager(client);
    }
    ;
    async init() {
        await this._loadCommands();
        this.initialized = true;
        this.client.logger.ready("Initialized the CommandManager.");
    }
    async _loadCommands() {
        const commandFolder = await readdir("./dist/commands/");
        const readSubCommandDir = async (folder) => {
            const files = await readdir(`./dist/commands/${folder}/`);
            const promises = [];
            for (const file of files)
                promises.push(this._loadFile(folder, file));
            await Promise.allSettled(promises);
        };
        const promises = [];
        for (const folder of commandFolder)
            promises.push(readSubCommandDir(folder));
        await Promise.allSettled(promises);
    }
    ;
    async _loadFile(folder, file) {
        const loadedFile = await import(`./../../commands/${folder}/${file}`);
        if (!this.isCommand(loadedFile))
            return;
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
        };
        this.commands.set(loadedFile.data.name, commandData);
    }
    ;
    isCommand(command) {
        if (!command.data)
            return false;
        if (!command.data.name)
            return false;
        if (!command.data.data)
            return false;
        return true;
    }
    ;
    async runCommand(commandExecutor) {
        if (commandExecutor.getAuthor.bot)
            return;
        const { commandName, client, getAuthor } = commandExecutor;
        // Don't process empty command names
        if (!commandName || commandName.trim() === "") {
            client.logger.debug("Empty command name received, ignoring");
            return;
        }
        client.logger.debug(`Attempting to run command: ${commandName}`);
        const command = this.getCommand(commandName);
        if (!command) {
            const res = this.lookALikeCommand(commandName);
            const embeds = [noCommandFound(client, commandName, res)];
            client.logger.debug(`Command not found: ${commandName}, suggested: [${res.join(", ")}]`);
            if (commandExecutor.isInteraction())
                return commandExecutor.reply({ embeds, flags: "Ephemeral" });
            else if (commandExecutor.isMessage())
                return commandExecutor.reply({ embeds }).then((msg) => setTimeout(async () => msg.deletable ? msg.delete() : null, 15000));
            return;
        }
        ;
        // Skip slash-only commands for message commands
        if (commandExecutor.isMessage() && command.options?.slashOnly) {
            client.logger.debug(`Skipping slash-only command attempted via message: ${commandName}`);
            return;
        }
        if (command.options?.cooldown && command.options?.cooldown !== 0) {
            const isCooldowned = this.cooldownManager.applyCooldown(commandName, getAuthor.id, command.options.cooldown);
            if (isCooldowned.isCooldowned && commandExecutor.isInteraction())
                return commandExecutor.reply(({ embeds: [youAreCooldowned(client, isCooldowned.remaining)], flags: "Ephemeral" }));
            else if (isCooldowned.isCooldowned && commandExecutor.isMessage())
                return commandExecutor.reply({ embeds: [youAreCooldowned(client, isCooldowned.remaining)] }).then((msg) => setTimeout(async () => msg.deletable ? msg.delete() : null, 15000));
        }
        ;
        // Process arguments for message commands
        if (commandExecutor.isMessage()) {
            if (this.handleArgs(command, commandExecutor)) {
                client.logger.debug(`Argument handling error for command: ${commandName}`);
                return;
            }
        }
        client.logger.debug(`Executing command: ${commandName}`);
        return command.execute(commandExecutor);
    }
    ;
    get getCommands() {
        return this.commands;
    }
    ;
    getCommand(commandName) {
        const command = this.commands.get(commandName);
        if (command)
            return command;
        const allCommands = this.commands.entries();
        for (const cmd of allCommands) {
            if (cmd[1].options?.aliases && !cmd[1].options?.slashOnly && cmd[1].options.aliases.length !== 0 && cmd[1].options.aliases.includes(commandName))
                return cmd[1];
            continue;
        }
        ;
        return undefined;
    }
    ;
    /**
     * Returns commands that look like it
     * @param cmdName
     * @returns
     */
    lookALikeCommand(cmdName) {
        if (cmdName.length > 10)
            return [];
        const commands = this.getCommands;
        const candidates = [];
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
        return candidate;
    }
    ;
    handleArgs(command, commandExecutor) {
        const commandArguments = command.data.toJSON().options;
        if (!commandArguments || commandArguments.length === 0 || !commandExecutor.isMessage()) {
            return false;
        }
        // Create a structured object to store processed arguments by name
        const processedArgs = {};
        const missingArguments = [];
        let currentArgIndex = 0;
        const userArgs = commandExecutor.arguments || [];
        // Process required arguments first, then optional ones
        const requiredArgs = commandArguments.filter(arg => arg.required);
        const optionalArgs = commandArguments.filter(arg => !arg.required);
        const allArgsInOrder = [...requiredArgs, ...optionalArgs];
        // Process each argument definition
        for (const arg of allArgsInOrder) {
            // Skip if we've run out of user-provided arguments and this arg is optional
            if (currentArgIndex >= userArgs.length && !arg.required) {
                continue;
            }
            // Check if we've run out of user arguments but still have required ones
            if (currentArgIndex >= userArgs.length && arg.required) {
                missingArguments.push({ type: arg.type, name: arg.name });
                continue;
            }
            const currentArg = userArgs[currentArgIndex];
            try {
                // Process different argument types
                switch (arg.type) {
                    case ApplicationCommandOptionType.Boolean:
                        // Convert to boolean
                        processedArgs[arg.name] = currentArg?.toLowerCase() === 'true' ||
                            currentArg?.toLowerCase() === 'yes' ||
                            currentArg === '1';
                        currentArgIndex++;
                        break;
                    case ApplicationCommandOptionType.Channel:
                        // Extract channel ID from mention
                        const channelMatch = currentArg.match(/<#(\d+)>/);
                        const channelId = channelMatch ? channelMatch[1] : currentArg;
                        // Validate the channel exists if required
                        const channel = commandExecutor.client.channels.cache.get(channelId);
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
                        // Convert to number and validate
                        const numValue = Number(currentArg);
                        if (isNaN(numValue) && arg.required) {
                            missingArguments.push({ type: arg.type, name: arg.name });
                            currentArgIndex++;
                            continue;
                        }
                        // Check min/max if specified
                        if ('min_value' in arg && numValue < arg.min_value) {
                            missingArguments.push({ type: arg.type, name: arg.name });
                            currentArgIndex++;
                            continue;
                        }
                        if ('max_value' in arg && numValue > arg.max_value) {
                            missingArguments.push({ type: arg.type, name: arg.name });
                            currentArgIndex++;
                            continue;
                        }
                        processedArgs[arg.name] = numValue;
                        currentArgIndex++;
                        break;
                    case ApplicationCommandOptionType.String:
                        // For strings, collect all remaining arguments if this is the last required argument
                        let stringValue;
                        // Check if it's the last required argument
                        const isLastRequiredArg = requiredArgs.indexOf(arg) === requiredArgs.length - 1;
                        if (isLastRequiredArg && arg === allArgsInOrder[allArgsInOrder.length - 1]) {
                            // If last argument overall, take all remaining args
                            stringValue = userArgs.slice(currentArgIndex).join(" ");
                            currentArgIndex = userArgs.length; // Consume all remaining arguments
                        }
                        else {
                            // Otherwise just take one argument
                            stringValue = currentArg;
                            currentArgIndex++;
                        }
                        // Validate string
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
                        if ('max_length' in arg && stringValue.length > arg.max_length) {
                            missingArguments.push({
                                type: ApplicationCommandOptionType.String,
                                max_length: true,
                                name: arg.name
                            });
                            continue;
                        }
                        if ('min_length' in arg && stringValue.length < arg.min_length) {
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
                        // Extract user ID from mention
                        const userMatch = currentArg.match(/<@!?(\d+)>/);
                        const userId = userMatch ? userMatch[1] : currentArg;
                        // Try to resolve the user if required
                        if (arg.required && !userId.match(/^\d+$/)) {
                            missingArguments.push({ type: arg.type, name: arg.name });
                            currentArgIndex++;
                            continue;
                        }
                        processedArgs[arg.name] = userId;
                        currentArgIndex++;
                        break;
                    case ApplicationCommandOptionType.Role:
                        // Extract role ID from mention
                        const roleMatch = currentArg.match(/<@&(\d+)>/);
                        const roleId = roleMatch ? roleMatch[1] : currentArg;
                        // Try to resolve the role if required
                        if (arg.required && !roleId.match(/^\d+$/)) {
                            missingArguments.push({ type: arg.type, name: arg.name });
                            currentArgIndex++;
                            continue;
                        }
                        processedArgs[arg.name] = roleId;
                        currentArgIndex++;
                        break;
                    // Add cases for other types as needed
                    default:
                        // Skip unknown argument types
                        currentArgIndex++;
                        continue;
                }
            }
            catch (error) {
                // If any error occurs during processing, mark as missing argument
                missingArguments.push({ type: arg.type, name: arg.name });
                currentArgIndex++;
                continue;
            }
        }
        // If any required arguments are missing, show error message
        if (missingArguments.length > 0) {
            return commandExecutor.reply({ embeds: [missingArgumentsEmbed(commandExecutor.client, missingArguments)] });
        }
        // Set parsed arguments on the executor for later use
        commandExecutor.parsedArgs = processedArgs;
        // Return false to indicate no error and processing can continue
        return false;
    }
}

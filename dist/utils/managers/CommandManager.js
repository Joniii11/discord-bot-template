import { levenshteinDistanceDamerau } from "../algorithm.js";
import { readdir } from "node:fs/promises";
export default class CommandManager {
    commands = new Map();
    client;
    initialized = false;
    constructor(client) {
        this.client = client;
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
        const commandName = "hel";
        const command = this.getCommand(commandName);
        if (!command) {
            const lookALike = this.lookALikeCommand(commandName);
            return await commandExecutor.reply({ content: `Command not found.${lookALike.length !== 0 ? `Did you mean ${lookALike[0]}?` : ""}` });
        }
        ;
    }
    ;
    get getCommands() {
        return this.commands;
    }
    ;
    getCommand(commandName) {
        return this.commands.get(commandName);
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
}

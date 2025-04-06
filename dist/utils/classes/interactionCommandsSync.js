import { ApplicationCommandOptionType } from "discord.js";
export async function registerSlashCommands(client, force = false) {
    if (!force) {
        if (!await checkCommandsUpdate(client))
            return client.logger.log("[Command Manager] Slash commands are the same as before, will not update!", "debug");
    }
    ;
    // Trying to refresh the slash commands
    try {
        client.logger.log("[Command Manager] Started refreshing slashcommands (/)...", "debug");
        const cmdData = [];
        client.manager.commandManager.getCommands.forEach((cmd) => {
            cmdData.push(cmd.data.toJSON());
        });
        // Refreshing
        await client.application?.commands.set(cmdData);
        client.logger.log("[Command Manager] Successfully reloaded slashcommands (/).", "ready");
    }
    catch (err) {
        client.logger.log("[Command Manager] Error while refreshing slashcommands (/)." + err, "error");
        return false;
    }
}
/**
 * Checks if the slash commands need to be updated.
 *
 * @returns A promise that resolves to a boolean indicating whether the commands need to be updated or not.
 */
export async function checkCommandsUpdate(client) {
    // Fetch the commands from the client's application
    const commands = await client.application?.commands.fetch();
    // Get the slashCommandOnly property from the client
    const slashCommands = client.manager.commandManager.getCommands;
    // Initialize a flag to track if an update is needed
    let needUpdate = false;
    // Check if commands exist
    if (commands) {
        if (commands.size !== slashCommands.size) {
            return true;
        }
        // Iterate over each command
        for (const command of commands) {
            // Get the corresponding command data from slashCommandOnly
            const newCommand = { data: slashCommands.get(command[1].name)?.data.toJSON() };
            if (!newCommand || !newCommand.data) {
                client.logger.debug("I couldn't find the newCommand from the slashCommandOnly collection. Force Update.");
                needUpdate = true;
                break;
            }
            // Check if the name is not equal or not
            if (newCommand.data.name !== command[1].name)
                return true;
            // Check if the description is not equal or not
            if (newCommand.data.description !== command[1].description)
                return true;
            if (!newCommand.data.options)
                continue;
            // Iterate over each option of the command
            for (let index = 0; index < newCommand.data.options.length; index++) {
                // Get the current command option from the fetched command
                const currentDiscordCommand = command[1].options[index];
                // Get the current command option from slashCommandOnly
                const currentLocalCommand = newCommand.data.options[index];
                if (!currentLocalCommand || !currentDiscordCommand)
                    return true;
                if (currentCommands(currentLocalCommand, currentDiscordCommand))
                    return true;
            }
        }
        // * When commands is undefined execute this bit of code.
    }
    else {
        client.logger.debug("Couldn't get any commands from the client. Force Update activated for this time.");
        needUpdate = true;
    }
    // Return the flag indicating if an update is needed
    return needUpdate;
}
;
/**
 * This function compares the properties of a local command and a Discord command to determine if any updates are needed.
 * It checks various properties such as name, description, type, options, and other specific properties based on the type of the command.
 * If any property differs between the local command and the Discord command, the function returns true indicating that an update is needed.
 * Otherwise, it returns false indicating that no updates are needed. Thanks code pal my code documentor slave >:)
 *
 * @param currentLocalCommand - The local command to compare.
 * @param currentDiscordCommand - The Discord command to compare.
 * @returns A boolean value indicating whether an update is needed or not.
 */
function currentCommands(currentLocalCommand, currentDiscordCommand) {
    // Check if the name of the option needs to be updated
    if (currentLocalCommand.name !== currentDiscordCommand?.name)
        return true;
    // Check if the description of the option needs to be updated
    if (currentLocalCommand.description !== currentDiscordCommand.description)
        return true;
    // Check if the localized description needs to be updated
    if (currentLocalCommand.description_localizations !== currentDiscordCommand.descriptionLocalized)
        return true;
    // Check if the localized name needs to be updated
    if (currentLocalCommand.name_localizations !== currentDiscordCommand.nameLocalized)
        return true;
    let counter = 0;
    switch (currentLocalCommand.type) {
        case ApplicationCommandOptionType.String:
            // Check if the type of the option needs to be updated
            if (currentLocalCommand.type !== currentDiscordCommand.type)
                return true;
            // Check if the max length of the option needs to be updated
            if (currentLocalCommand.max_length !== currentDiscordCommand.maxLength)
                return true;
            // Check if the min length of the option needs to be updated
            if (currentLocalCommand.min_length !== currentDiscordCommand.minLength)
                return true;
            // Check if the required property needs to be updated
            if (!compareBools((currentLocalCommand.required ?? false), (currentDiscordCommand.required ?? false)))
                return true;
            break;
        case ApplicationCommandOptionType.Subcommand:
            // Check if the type of the option needs to be updated
            if (currentLocalCommand.type !== currentDiscordCommand.type)
                return true;
            // Check if both options are defined
            if (!currentLocalCommand.options || !currentDiscordCommand.options)
                break;
            for (let i = 0; i < currentLocalCommand.options.length; i++) {
                // Check if the name of the option needs to be updated
                if (currentLocalCommand.options[i]?.name !== currentDiscordCommand.options[i]?.name)
                    return true;
                // Check if the description of the option needs to be updated
                if (currentLocalCommand.options[i]?.description !== currentDiscordCommand.options[i]?.description)
                    return true;
                // Check if the type of the option needs to be updated
                if (currentLocalCommand.options[i]?.type !== currentDiscordCommand.options[i]?.type)
                    return true;
                // Check if the required property needs to be updated
                if (!compareBools((currentLocalCommand.options[i]?.required ?? false), (currentDiscordCommand.options[i]?.required ?? false)))
                    return true;
            }
            break;
        case ApplicationCommandOptionType.SubcommandGroup:
            // Check if the type of the option needs to be updated
            if (currentLocalCommand.type !== currentDiscordCommand.type)
                return true;
            // Check if both options are defined
            if (!currentLocalCommand.options || !currentDiscordCommand.options)
                break;
            for (const opt of currentLocalCommand.options) {
                // Check if the name of the option needs to be updated
                if (opt.name !== currentDiscordCommand.options[counter]?.name)
                    return true;
                // Check if the description of the option needs to be updated
                if (opt.description !== currentDiscordCommand.options[counter]?.description)
                    return true;
                counter++;
            }
            break;
        case ApplicationCommandOptionType.Integer:
            // Check if the type of the option needs to be updated
            if (currentLocalCommand.type !== currentDiscordCommand.type)
                return true;
            // Check if the max value of the option needs to be updated
            if (currentLocalCommand.max_value !== currentDiscordCommand.maxValue)
                return true;
            // Check if the min value of the option needs to be updated
            if (currentLocalCommand.min_value !== currentDiscordCommand.minValue)
                return true;
            // Check if the autocomplete property needs to be updated
            if (!compareBools((currentLocalCommand.autocomplete ?? false), (currentDiscordCommand.autocomplete ?? false)))
                return true;
            // Check if the required property needs to be updated
            if (!compareBools((currentLocalCommand.required ?? false), (currentDiscordCommand.required ?? false)))
                return true;
            break;
        case ApplicationCommandOptionType.Boolean:
            // Check if the type of the option needs to be updated
            if (currentLocalCommand.type !== currentDiscordCommand.type)
                return true;
            // Check if the required property needs to be updated
            if (!compareBools((currentLocalCommand.required ?? false), (currentDiscordCommand.required ?? false)))
                return true;
            break;
        case ApplicationCommandOptionType.User:
            // Check if the type of the option needs to be updated
            if (currentLocalCommand.type !== currentDiscordCommand.type)
                return true;
            // Check if the required property needs to be updated
            if (!compareBools((currentLocalCommand.required ?? false), (currentDiscordCommand.required ?? false)))
                return true;
            break;
        case ApplicationCommandOptionType.Channel:
            // Check if the type of the option needs to be updated
            if (currentLocalCommand.type !== currentDiscordCommand.type)
                return true;
            // Check if the channel types of the option needs to be updated
            if (currentLocalCommand.channel_types !== currentDiscordCommand.channelTypes)
                return true;
            // Check if the required property needs to be updated
            if (!compareBools((currentLocalCommand.required ?? false), (currentDiscordCommand.required ?? false)))
                return true;
            break;
        case ApplicationCommandOptionType.Role:
            // Check if the type of the option needs to be updated
            if (currentLocalCommand.type !== currentDiscordCommand.type)
                return true;
            // Check if the required property needs to be updated
            if (!compareBools((currentLocalCommand.required ?? false), (currentDiscordCommand.required ?? false)))
                return true;
            break;
        case ApplicationCommandOptionType.Number:
            // Check if the type of the option needs to be updated
            if (currentLocalCommand.type !== currentDiscordCommand.type)
                return true;
            // Check if the max value of the option needs to be updated
            if (currentLocalCommand.max_value !== currentDiscordCommand.maxValue)
                return true;
            // Check if the min value of the option needs to be updated
            if (currentLocalCommand.min_value !== currentDiscordCommand.minValue)
                return true;
            // Check if the autocomplete property needs to be updated
            if (!compareBools((currentLocalCommand.autocomplete ?? false), (currentDiscordCommand.autocomplete ?? false)))
                return true;
            // Check if the required property needs to be updated
            if (!compareBools((currentLocalCommand.required ?? false), (currentDiscordCommand.required ?? false)))
                return true;
            break;
        case ApplicationCommandOptionType.Attachment:
            // Check if the type of the option needs to be updated
            if (currentLocalCommand.type !== currentDiscordCommand.type)
                return true;
            // Check if the required property needs to be updated
            if (!compareBools((currentLocalCommand.required ?? false), (currentDiscordCommand.required ?? false)))
                return true;
            break;
        default:
            break;
    }
    ;
    // If no differences were found, return false indicating no updates are needed
    return false;
}
/**
 * Compares two boolean values and returns true if they are equal, false otherwise.
 *
 * @param a - The first boolean value.
 * @param b - The second boolean value.
 * @returns A boolean value indicating whether the two boolean values are equal or not.
 */
function compareBools(a, b) {
    return (a && b) || (!a && !b);
}

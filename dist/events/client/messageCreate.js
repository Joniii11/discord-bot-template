import { eventFile } from "../../utils/types/eventTypes.js";
export const data = eventFile({
    name: "messageCreate",
    once: false,
    execute: async (client, message) => {
        // Early check to avoid unnecessary processing
        if (message.author.bot)
            return;
        // Check if message starts with prefix
        if (!message.content.startsWith(client.config.prefix))
            return;
        // Process the message command
        await client.manager.messageManager._eventRunner(client, message);
    }
});

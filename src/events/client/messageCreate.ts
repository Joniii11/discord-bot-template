import { eventFile } from "../../utils/types/eventTypes.js";

export const data = eventFile({
    name: "messageCreate",

    execute: async (client, message) => await client.manager.messageManager._eventRunner(client, message)
});
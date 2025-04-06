import { eventFile } from "../../utils/types/eventTypes.js";
export const data = eventFile({
    name: "interactionCreate",
    execute: async (client, interaction) => await client.manager.interactionManager._eventRunner(client, interaction)
});

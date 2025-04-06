import { eventFile } from "../../utils/types/eventTypes.js";
export const data = eventFile({
    name: "ready",
    once: true,
    execute: async (client) => {
        client.logger.ready(`Logged in as ${client.user?.username}!`);
        if (client.cluster.ready)
            await client.manager.initOnClientReadyAndMaintenanceOff();
    }
});

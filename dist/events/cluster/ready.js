import { eventFile } from "../../utils/types/eventTypes.js";
export const data = eventFile({
    name: "ready",
    eventGetter: "cluster",
    execute: async (client) => {
        client.logger.ready("The cluster is now ready.");
        if (client.isReady())
            await client.manager.initOnClientReadyAndMaintenanceOff();
    }
});

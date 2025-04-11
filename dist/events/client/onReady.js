import { registerSlashCommands } from "../../utils/helpers/interactionCommandsSync.js";
import { eventFile } from "../../utils/types/eventTypes.js";
export const data = eventFile({
    name: "ready",
    once: true,
    execute: async (client, readyClient) => {
        const id = setInterval(async () => {
            if (client.isReady()) {
                clearInterval(id);
                client.logger.ready(`Logged in as ${client.user.username}!`);
                if (client.cluster.ready)
                    await client.manager.initOnClientReadyAndMaintenanceOff();
                await registerSlashCommands(client);
            }
            ;
        }, 500);
    }
});

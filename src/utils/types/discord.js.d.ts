import { ClusterClient } from "discord-hybrid-sharding";
import Logger from "../structures/Logger.ts";

declare module "discord.js" {
    export interface Client {
        cluster: ClusterClient<Client>;
        logger: Logger;
    }
}

export {};
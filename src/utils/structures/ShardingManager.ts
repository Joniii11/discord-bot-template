import { ClusterManager, ReClusterManager, HeartbeatManager } from "discord-hybrid-sharding";

import config from "../config.js";
import Logger from "./Logger.js";

export default class Sharder extends ClusterManager {
    private logger = new Logger({ prefix: "SHARDING MANAGER", showDebug: config.showDebug });

    public constructor() {
        super("./dist/Bot.js", {
            token: config.token,
            mode: "process",
            totalClusters: "auto",
            shardsPerClusters: 6,
            totalShards: "auto",
            restarts: {
                max: 10,
                interval: 60000 * 60
            }
        });

        this.extend(
            new HeartbeatManager({
                interval: 2000,
                maxMissedHeartbeats: 5
            }),

            new ReClusterManager()
        );

        this.hooks = {
            ...this.hooks,
            constructClusterArgs: (cluster, args) => {
                return [
                    ...args,
                    // This gives the process a custom name when viewed in the process list (htop, task manager, etc...)
                    `Cluster: #${cluster.id}, Shard${cluster.shardList.length !== 1 ? "s" : ""}: ${cluster.shardList}`
                ]
            }
        };

        this.on("debug", (...args) => {
            try {
                this.logger.debug(args.shift(), ...args);
            } catch (err) {
                this.logger.error("Failed to log debug information", err);
            }
        });

        this.on("clusterCreate", async (cluster) => this.logger.ready(`Launched Cluster #${cluster.id} | ${cluster.id+1}/${this.totalClusters} [${this.shardsPerClusters}/${this.totalShards} Shards]`));
    };

    public async launch() {
        try {
            await this.spawn({ timeout: -1, delay: 7000, });
        } catch (err) {
            this.logger.error("Failed to launch the Sharder", err);
        }
    }
}
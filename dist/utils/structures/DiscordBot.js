import { Client, Options, Partials } from "discord.js";
import config from "../config.js";
import { ClusterClient } from "discord-hybrid-sharding";
import Logger from "./Logger.js";
import Manager from "../managers/index.js";
export default class DiscordBot extends Client {
    logger = new Logger({ prefix: "BOT", showDebug: config.showDebug });
    cluster = new ClusterClient(this);
    manager;
    config = config;
    constructor() {
        super({
            intents: [
                "Guilds",
                "GuildMessages",
                "GuildMembers",
                "MessageContent"
            ],
            partials: [
                Partials.Message,
                Partials.GuildMember,
                Partials.User
            ],
            allowedMentions: {
                parse: ["users", "roles"],
                repliedUser: true
            },
            makeCache: Options.cacheWithLimits({
                BaseGuildEmojiManager: 0,
                PresenceManager: 0,
                StageInstanceManager: 0,
                ReactionManager: 0,
                ReactionUserManager: 0,
                GuildStickerManager: 0
            }),
            sweepers: {
                ...Options.DefaultSweeperSettings,
                messages: {
                    interval: 900,
                    lifetime: 1800,
                },
                guildMembers: {
                    interval: 300,
                    filter: () => (member) => !((member.id === member.client.user.id) || member.voice.channel)
                },
                users: {
                    interval: 300,
                    filter: () => user => !(user.id === user.client.user.id),
                },
                reactions: {
                    interval: 50,
                    filter: () => _reaction => true
                }
            },
            //? Sharding
            shards: ClusterClient.getInfo().SHARD_LIST,
            shardCount: ClusterClient.getInfo().TOTAL_SHARDS,
        });
        this.manager = new Manager(this);
    }
    ;
    async init() {
        await this.manager.init();
        await this.start();
    }
    async start() {
        this.logger.info("Logging the bot in...");
        return super.login(config.token);
    }
    ;
}

import DiscordBot from "../structures/DiscordBot.js";
import CommandManager from "./CommandManager.js";
import CooldownManager from "./CooldownManager.js";
import EventManager from "./EventManager.js";
import InteractionManager from "./InteractionManager.js";
import MessageManager from "./MessageManager.js";

export default class Manager {
    private client: DiscordBot;

    // Managers
    public eventManager: EventManager;
    public messageManager: MessageManager;
    public interactionManager: InteractionManager
    public commandManager: CommandManager;
    public cooldownManager: CooldownManager;

    public constructor(client: DiscordBot) {
        this.client = client;

        // Initialize Managers
        this.eventManager = new EventManager(this.client);
        this.messageManager = new MessageManager(this.client);
        this.interactionManager = new InteractionManager(this.client);
        this.commandManager = new CommandManager(this.client);
        this.cooldownManager = new CooldownManager(this.client);
    };

    public async init(): Promise<void> {
        this.client.logger.debug("Initializing the Manager...");

        await Promise.allSettled([this.eventManager.init(), this.commandManager.init()]).catch((err) => this.client.logger.error("Error occured while initializing the Manager.", err));

        //? Initialize the Manager
        this.client.logger.ready("Initialized the Manager!");
    };

    public async initOnClientReadyAndMaintenanceOff() {
        await Promise.allSettled([this.messageManager.init(), this.interactionManager.init()])
    }
}
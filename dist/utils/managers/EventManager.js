import { readdir } from "fs/promises";
export default class EventManager {
    client;
    // Previously using ExistingEvents, now event names are just strings.
    events = new Map();
    constructor(client) {
        this.client = client;
    }
    async init() {
        await this.loadEvents();
        this.registerEvents();
        this.client.logger.ready("Initialized the Event Manager!");
        //console.log(this.events)
    }
    async loadEvents() {
        const eventFolders = await readdir(`./dist/events`);
        if (!eventFolders.length)
            throw new Error("No event folders found!");
        const promises = [];
        for (const folder of eventFolders) {
            promises.push(this.loadEventFile(folder));
        }
        await Promise.allSettled(promises).catch((err) => this.client.logger.error("Error occurred while loading the events.", err));
    }
    /**
     * Registers all events based on their eventGetter.
     * For known getters (like "discord" or "cluster"), the emitter is directly available on the client.
     * For any additional event getters, this method looks for a corresponding emitter on the client.
     */
    registerEvents(events) {
        for (const [name, configuration] of events ?? this.events) {
            switch (configuration.eventGetter) {
                case "discord": {
                    if (configuration.once) {
                        this.client.once(name, async (...args) => await this.eventRunner(name, configuration, ...args));
                    }
                    else {
                        this.client.on(name, async (...args) => await this.eventRunner(name, configuration, ...args));
                    }
                    break;
                }
                case "cluster": {
                    if (configuration.once) {
                        this.client.cluster.once(name, async (...args) => await this.eventRunner(name, configuration, ...args));
                    }
                    else {
                        this.client.cluster.on(name, async (...args) => await this.eventRunner(name, configuration, ...args));
                    }
                    break;
                }
                default: {
                    // For any other custom event getter, we try to retrieve the corresponding emitter on the client.
                    const emitter = this.client[configuration.eventGetter];
                    if (emitter && typeof emitter.on === "function" && typeof emitter.once === "function") {
                        if (configuration.once) {
                            emitter.once(name, async (...args) => await this.eventRunner(name, configuration, ...args));
                        }
                        else {
                            emitter.on(name, async (...args) => await this.eventRunner(name, configuration, ...args));
                        }
                    }
                    else {
                        this.client.logger.warn(`Unsupported event getter: ${configuration.eventGetter}`);
                    }
                    break;
                }
            }
        }
    }
    addEvent(name, configuration) {
        this.events.set(name, configuration);
        const eventsMap = new Map();
        eventsMap.set(name, configuration);
        this.registerEvents(eventsMap);
    }
    async eventRunner(name, configuration, ...args) {
        const { function: functions, once } = configuration;
        if (once)
            this.events.delete(name);
        const promises = [];
        for (const func of functions)
            promises.push(func(this.client, ...args));
        await Promise.allSettled(promises);
    }
    async loadEventFile(eventFolder) {
        const files = await readdir(`./dist/events/${eventFolder}`);
        this.client.logger.debug(`Loading ${files.length} event files from ${eventFolder}...`);
        const promises = [];
        const loadFile = async (fileName) => {
            const file = await import(`../../events/${eventFolder}/${fileName}`);
            if (!this.isEventFile(file))
                return;
            const eventName = file.data.name;
            if (this.events.has(eventName)) {
                const existing = this.events.get(eventName);
                existing.function.push(file.data.execute);
                this.events.set(eventName, existing);
            }
            else {
                this.events.set(eventName, {
                    function: [file.data.execute],
                    once: file.data.once,
                    eventGetter: file.data.eventGetter,
                });
            }
        };
        for (const file of files) {
            promises.push(loadFile(file));
        }
        await Promise.allSettled(promises).catch((err) => this.client.logger.error(`Error occurred while loading the event files from ${eventFolder}`, err));
    }
    isEventFile(file) {
        return (!!file.data &&
            !!file.data.name &&
            !!file.data.execute &&
            typeof file.data.execute === "function");
    }
}

import DiscordBot from "../structures/DiscordBot.js";

export default class CooldownManager {
    private cooldowns = new Map<string, Map<string, Date>>();
    private client: DiscordBot;

    public constructor(client: DiscordBot) {
        this.client = client;
    }

    private getCommandCooldownMap(commandName: string): Map<string, Date> {
        if (!this.cooldowns.has(commandName)) {
            this.cooldowns.set(commandName, new Map());
        }
        return this.cooldowns.get(commandName)!;
    }

    public setCooldown(commandName: string, userId: string, cooldownSeconds: number): void {
        const commandMap = this.getCommandCooldownMap(commandName);
        const expiration = new Date(Date.now() + cooldownSeconds * 1000);
        commandMap.set(userId, expiration);
    }

    public checkCooldown(commandName: string, userId: string): number {
        const commandMap = this.getCommandCooldownMap(commandName);
        const expiration = commandMap.get(userId);
        
        if (!expiration) return 0;

        const now = Date.now();
        const remaining = expiration.getTime() - now;
        return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
    }

    public applyCooldown(commandName: string, userId: string, cooldownSeconds: number): isCooldowned {
        const remaining = this.checkCooldown(commandName, userId);
        
        if (remaining > 0) {
            return { isCooldowned: true, remaining };
        }

        this.setCooldown(commandName, userId, cooldownSeconds);
        return { isCooldowned: false }
    };
}

interface isCooldownedTrue {
    isCooldowned: true;
    remaining: number
};

interface isCooldownedFalse {
    isCooldowned: false;
    remaining?: never
};

export type isCooldowned = isCooldownedFalse | isCooldownedTrue;
export default class CooldownManager {
    cooldowns = new Map();
    client;
    constructor(client) {
        this.client = client;
    }
    getCommandCooldownMap(commandName) {
        if (!this.cooldowns.has(commandName)) {
            this.cooldowns.set(commandName, new Map());
        }
        return this.cooldowns.get(commandName);
    }
    setCooldown(commandName, userId, cooldownSeconds) {
        const commandMap = this.getCommandCooldownMap(commandName);
        const expiration = new Date(Date.now() + cooldownSeconds * 1000);
        commandMap.set(userId, expiration);
    }
    checkCooldown(commandName, userId) {
        const commandMap = this.getCommandCooldownMap(commandName);
        const expiration = commandMap.get(userId);
        if (!expiration)
            return 0;
        const now = Date.now();
        const remaining = expiration.getTime() - now;
        return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
    }
    applyCooldown(commandName, userId, cooldownSeconds) {
        const remaining = this.checkCooldown(commandName, userId);
        if (remaining > 0) {
            return { isCooldowned: true, remaining };
        }
        this.setCooldown(commandName, userId, cooldownSeconds);
        return { isCooldowned: false };
    }
    ;
}
;
;

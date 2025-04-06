import { __dirnamePopulator } from "./utils/__dirname.js";
import DiscordBot from "./utils/structures/DiscordBot.js";

// Init top async
void (async () => {
    globalThis.dirname = __dirnamePopulator;

    const bot = new DiscordBot();
    await bot.init();
})();
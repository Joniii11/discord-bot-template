import { __dirnamePopulator } from "./utils/__dirname.js";
import Sharder from "./utils/structures/ShardingManager.js";
// Init top async
void (async () => {
    globalThis.dirname = __dirnamePopulator;
    const sharder = new Sharder();
    await sharder.launch();
})();

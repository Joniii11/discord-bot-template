import { fileURLToPath } from 'url';
import path from 'path';

export function __dirnamePopulator() {
    return process.cwd()
};

export function __dirnamePop() {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    return __dirname;
}
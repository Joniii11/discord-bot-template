import chalk from "chalk";
import moment from "moment";
export default class Logger {
    prefix;
    showDebug;
    constructor({ prefix, showDebug }) {
        this.prefix = prefix;
        this.showDebug = showDebug;
    }
    /**
     * Prints to stderr with newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values similar to printf(3).
     */
    error(content, ...optionalParams) {
        console.error(`${this._dateFormat} ${this.prefix ? chalk.bgGray(`${this.prefix} >>`) : ""} ${chalk.bgRed("Error >>")} ${chalk.redBright(content)}`, ...optionalParams);
    }
    log(content, ...optionalParams) {
        console.log(`${this._dateFormat} ${this.prefix ? chalk.bgGray(`${this.prefix} >>`) : ""} ${chalk.bgBlue("Log >>")} ${content}`, ...optionalParams);
    }
    warn(content, ...optionalParams) {
        console.warn(`${this._dateFormat} ${this.prefix ? chalk.bgGray(`${this.prefix} >>`) : ""} ${chalk.bgYellow("Warn >>")} ${content}`, ...optionalParams);
    }
    info(content, ...optionalParams) {
        console.info(`${this._dateFormat} ${this.prefix ? chalk.bgGray(`${this.prefix} >>`) : ""} ${chalk.bgBlue("Info >>")} ${content}`, ...optionalParams);
    }
    debug(content, ...optionalParams) {
        if (this.showDebug)
            console.debug(`${this._dateFormat} ${this.prefix ? chalk.bgGray(`${this.prefix} >>`) : ""} ${chalk.grey("Debug >>")} ${chalk.gray(content)}`, ...optionalParams);
    }
    ready(content, ...optionalParams) {
        console.log(`${this._dateFormat} ${this.prefix ? chalk.bgGray(`${this.prefix} >>`) : ""} ${chalk.bgHex("#067032")("Ready >>")} ${content}`, ...optionalParams);
    }
    get _dateFormat() {
        return chalk.yellow(moment().format("DD-MM-YYYY hh:mm:ss")) + " |";
    }
}

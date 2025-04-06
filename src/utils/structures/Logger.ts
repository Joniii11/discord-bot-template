import chalk from "chalk";
import moment from "moment";

export default class Logger {
  private prefix?: string;
  private showDebug: boolean;

  public constructor({ prefix, showDebug }: LoggerConfiguration) {
    this.prefix = prefix;
    this.showDebug = showDebug;
  }

  /**
   * Prints to stderr with newline. Multiple arguments can be passed, with the first used as the primary message and all additional used as substitution values similar to printf(3).
   */
  public error(content: any, ...optionalParams: any[]) {
    console.error(
      `${this._dateFormat} ${this.prefix ? chalk.bgGray(`${this.prefix} >>`) : ""} ${chalk.bgRed("Error >>")} ${chalk.redBright(content)}`,
      ...optionalParams
    );
  }

  public log(content: any, ...optionalParams: any[]) {
    console.log(
      `${this._dateFormat} ${this.prefix ? chalk.bgGray(`${this.prefix} >>`) : ""} ${chalk.bgBlue("Log >>")} ${content}`,
      ...optionalParams
    );
  }

  public warn(content: any, ...optionalParams: any[]) {
    console.warn(
      `${this._dateFormat} ${this.prefix ? chalk.bgGray(`${this.prefix} >>`) : ""} ${chalk.bgYellow("Warn >>")} ${content}`,
      ...optionalParams
    );
  }

  public info(content: any, ...optionalParams: any[]) {
    console.info(
      `${this._dateFormat} ${this.prefix ? chalk.bgGray(`${this.prefix} >>`) : ""} ${chalk.bgBlue("Info >>")} ${content}`,
      ...optionalParams
    );
  }

  public debug(content: any, ...optionalParams: any[]) {
    if (this.showDebug) console.debug(
        `${this._dateFormat} ${this.prefix ? chalk.bgGray(`${this.prefix} >>`) : ""} ${chalk.grey("Debug >>")} ${chalk.gray(content)}`,
        ...optionalParams
      );
  }

  public ready(content: any, ...optionalParams: any[]) {
    console.log(
      `${this._dateFormat} ${this.prefix ? chalk.bgGray(`${this.prefix} >>`) : ""} ${chalk.bgHex("#067032")("Ready >>")} ${content}`,
      ...optionalParams
    );
  }

  private get _dateFormat() {
    return chalk.yellow(moment().format("DD-MM-YYYY hh:mm:ss")) + " |";
  }
}

export interface LoggerConfiguration {
  prefix?: string;
  showDebug: boolean;
}
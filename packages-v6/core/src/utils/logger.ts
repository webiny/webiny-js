import chalk, { Chalk } from "chalk";

const getLogType = (type: string) => {
    switch (type) {
        case "info":
            return `${chalk.blueBright(type)}`;
        case "error":
            return `${chalk.red(type)}`;
        case "warning":
            return `${chalk.yellow(type)}`;
        case "debug":
            return `${chalk.grey(type)}`;
        case "success":
            return `${chalk.green(type)}`;
        default:
            return type;
    }
};

export interface ConsoleLog {
    (...args: unknown[]): void;
    hl: Chalk;
}

export interface Logger {
    log: ConsoleLog;
    info: ConsoleLog;
    success: ConsoleLog;
    debug: ConsoleLog;
    warning: ConsoleLog;
    error: ConsoleLog;
}

export const createLogger = (debugMode: boolean): Logger => {
    const webinyLog = (type: string, ...args: unknown[]) => {
        const prefix = type !== "log" ? `${getLogType(type)}: ` : "";

        const [first, ...rest] = args;
        if (typeof first === "string") {
            return console.log(prefix + first, ...rest);
        }
        return console.log(prefix, first, ...rest);
    };

    const log: ConsoleLog = (...args) => {
        webinyLog("log", ...args);
    };

    log.hl = chalk.bold;

    const info: ConsoleLog = (...args) => {
        webinyLog("info", ...args);
    };

    info.hl = chalk.blueBright;

    const success: ConsoleLog = (...args) => {
        webinyLog("success", ...args);
    };

    success.hl = chalk.green;

    const debug: ConsoleLog = (...args) => {
        if (debugMode) {
            webinyLog("debug", ...args);
        }
    };

    debug.hl = chalk.gray;

    const warning: ConsoleLog = (...args) => {
        webinyLog("warning", ...args);
    };

    warning.hl = chalk.yellow;

    const error: ConsoleLog = (...args) => {
        webinyLog("error", ...args);
    };

    error.hl = chalk.red;

    return { log, info, success, debug, warning, error };
};

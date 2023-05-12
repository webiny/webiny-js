const chalk = require("chalk");

const logColors = {
    log: v => v,
    info: chalk.blueBright,
    error: chalk.red,
    warning: chalk.yellow,
    debug: chalk.gray,
    success: chalk.green
};

const colorizePlaceholders = (type, string) => {
    return string.replace(/\%[a-zA-Z]/g, match => {
        return logColors[type](match);
    });
};

const log = (type, ...args) => {
    const prefix = `webiny ${logColors[type](type)}: `;

    const [first, ...rest] = args;
    if (typeof first === "string") {
        return console.log(prefix + colorizePlaceholders(type, first), ...rest);
    }
    return console.log(prefix, first, ...rest);
};

class ConsoleLogger {
    log(...args) {
        log("log", ...args);
    }

    info(...args) {
        log("info", ...args);
    }

    success(...args) {
        log("success", ...args);
    }

    debug(...args) {
        log("debug", ...args);
    }

    warning(...args) {
        log("warning", ...args);
    }

    error(...args) {
        log("error", ...args);
    }
}

module.exports = { ConsoleLogger };

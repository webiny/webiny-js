const chalk = require("chalk");

const getLogType = type => {
    switch (type) {
        case "log":
            return type;
        case "info":
            return `${chalk.blue(type)}`;
        case "error":
            return `${chalk.red(type)}`;
        case "warning":
            return `${chalk.yellow(type)}`;
        case "debug":
            return `${chalk.gray(type)}`;
        case "success":
            return `${chalk.green(type)}`;
    }
};

const webinyLog = (type, ...args) => {
    const prefix = `webiny ${getLogType(type)}: `;

    const [first, ...rest] = args;
    if (typeof first === "string") {
        return console.log(prefix + first, ...rest);
    }
    return console.log(prefix, first, ...rest);
};

const functions = {
    log(...args) {
        webinyLog("log", ...args);
    },

    info(...args) {
        webinyLog("info", ...args);
    },

    success(...args) {
        webinyLog("success", ...args);
    },

    debug(...args) {
        webinyLog("debug", ...args);
    },

    warning(...args) {
        webinyLog("warning", ...args);
    },

    error(...args) {
        webinyLog("error", ...args);
    }
};

functions.log.highlight = chalk.highlight;
functions.log.hl = chalk.highlight;
functions.info.highlight = chalk.blue;
functions.info.hl = chalk.blue;
functions.success.highlight = chalk.green;
functions.success.hl = chalk.green;
functions.debug.highlight = chalk.gray;
functions.debug.hl = chalk.gray;
functions.warning.highlight = chalk.yellow;
functions.warning.hl = chalk.yellow;
functions.error.highlight = chalk.red;
functions.error.hl = chalk.red;

module.exports = functions;

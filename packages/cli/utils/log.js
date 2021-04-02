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

module.exports = {
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

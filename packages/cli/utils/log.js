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

const webinyLog = (type, ...args) => {
    const prefix = `webiny ${logColors[type](type)}: `;

    const [first, ...rest] = args;
    if (typeof first === "string") {
        return console.log(prefix + colorizePlaceholders(type, first), ...rest);
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
functions.info.hl = chalk.blueBright;
functions.success.highlight = chalk.green;
functions.success.hl = chalk.green;
functions.debug.highlight = chalk.gray;
functions.debug.hl = chalk.gray;
functions.warning.highlight = chalk.yellow;
functions.warning.hl = chalk.yellow;
functions.error.highlight = chalk.red;
functions.error.hl = chalk.red;

module.exports = functions;

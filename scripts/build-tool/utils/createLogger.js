// @flowIgnore
const chalk = require("chalk");
const randomColor = require("random-color");

const usedColors = [];
const loggers = {};

module.exports = name => {
    if (loggers[name]) {
        return loggers[name];
    }

    let color;
    do {
        color = randomColor().hexString();
    } while (usedColors.includes(color));

    usedColors.push(color);

    loggers[name] = (msg, ...args) => {
        // eslint-disable-next-line
        console.log(chalk.hex(color)(name) + ": " + msg, ...args);
    };

    return loggers[name];
};

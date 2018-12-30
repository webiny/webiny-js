const chalk = require("chalk");

String.prototype.format = function() {
    return [...arguments].reduce((p, c) => p.replace(/%s/, c), this);
};

/**
 * Logger with `log` and `error` function.
 */
const formatString = (format, rest = []) => {
    return `${format.replace(/%[^%]/g, seq => chalk.magenta(seq))}`.format(...rest);
};
module.exports = () => {
    return {
        log(...args) {
            const [format, ...rest] = args;
            console.log(`${chalk.blue("＞")} ${formatString(format, rest)}`);
        },
        error(...args) {
            const [format, ...rest] = args;
            console.error(`❌ ${formatString(format, rest)}`);
        },
        info(...args) {
            const [format, ...rest] = args;
            return console.log(chalk.blue("ℹ") + ` ${formatString(format, rest)}`);
        },
        success(...args) {
            const [format, ...rest] = args;
            return console.log(chalk.green("✔") + ` ${formatString(format, rest)}`);
        }
    };
};

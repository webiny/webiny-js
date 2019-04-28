const chalk = require("chalk");
const stripColor = require("strip-ansi");

String.prototype.format = function() {
    return [...arguments].reduce((p, c) => p.replace(/%s/, c), this);
};

/**
 * Logger with `log` and `error` function.
 */
const formatString = (format, rest = []) => {
    return `${format.replace(/%[^%]/g, seq => chalk.magenta(seq))}`.format(...rest);
};

const currentTime = () => {
    const t = new Date();
    const seconds = t.getSeconds();
    return chalk.grey(
        `[${t.getHours()}:${t.getMinutes()}:${seconds < 10 ? `0${seconds}` : seconds}]`
    );
};

module.exports = {
    log(...args) {
        const [format, ...rest] = args;
        const log = `${currentTime()} ${chalk.blue("＞")} ${formatString(format, rest)}`;
        console.log(log);
        this.logToFile(log);
    },
    error(...args) {
        const [format, ...rest] = args;
        const log = `${currentTime()} ❌ ${formatString(format, rest)}`;
        console.error(log);
        this.logToFile(log);
    },
    info(...args) {
        const [format, ...rest] = args;
        const log = `${currentTime()} ${chalk.blue("ℹ")} ${formatString(format, rest)}`;
        console.log(log);
        this.logToFile(log);
    },
    success(...args) {
        const [format, ...rest] = args;
        const log = `${currentTime()} ${chalk.green("✔")} ${formatString(format, rest)}`;
        console.log(log);
        this.logToFile(log);
    },
    setLogFile(file) {
        this.logFile = file;
    },
    logFile: null,
    logToFile: log => {
        if (this.logFile) {
            this.logFile.write(`${stripColor(log)}\n`);
        }
    }
};

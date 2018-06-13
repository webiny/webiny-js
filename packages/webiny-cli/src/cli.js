const chalk = require("chalk");

module.exports = {
    directory: {
        root: process.cwd(),
        api: process.cwd() + "/api",
        client: process.cwd() + "/client"
    },
    info(message) {
        console.log(chalk.cyan(message));
    },
    success(message) {
        console.log(chalk.green(message));
    },
    warning(message) {
        console.log(chalk.yellow(message));
    },
    error(message) {
        console.log(chalk.red(message));
    }
};

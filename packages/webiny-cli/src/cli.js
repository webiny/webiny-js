// @flow
const chalk = require("chalk");

module.exports = {
    directory: {
        root: process.cwd(),
        api: process.cwd() + "/api",
        client: process.cwd() + "/client"
    },

    // Ensure a-zA-Z0-9_ characters were used.
    validateName(name: string): void {
        if (name.length < 2) {
            throw Error("Name requires at least 2 characters.");
        }

        if (!/^[a-zA-Z0-9_]+$/.test(name)) {
            throw Error('Name must consist of letters, numbers and optionally "_".');
        }
    },

    info(message: string): void {
        // eslint-disable-next-line
        console.log(chalk.cyan(message));
    },
    success(message: string): void {
        // eslint-disable-next-line
        console.log(chalk.green(message));
    },
    warning(message: string): void {
        // eslint-disable-next-line
        console.log(chalk.yellow(message));
    },
    error(message: string): void {
        // eslint-disable-next-line
        console.log(chalk.red(message));
    }
};

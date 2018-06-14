const chalk = require("chalk");

module.exports = {
    directory: {
        root: process.cwd(),
        api: process.cwd() + "/api",
        client: process.cwd() + "/client"
    },

    // Ensure a-zA-Z0-9_ characters were used.
    validateName(name) {
        if (name.length < 2) {
            throw Error("Name requires at least 2 characters.");
        }

        if (!/^[a-zA-Z0-9_]+$/.test(name)) {
            throw Error('Name must consist of letters, numbers and optionally "_".');
        }
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

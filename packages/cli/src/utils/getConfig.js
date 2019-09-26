const cosmiconfig = require("cosmiconfig");
const chalk = require("chalk");

module.exports = async () => {
    // Load webiny.config.js
    const explorer = cosmiconfig("webiny");
    const search = await explorer.search();

    if (!search) {
        console.log(chalk.red(`Configuration file ("webiny.config.js") not found.`));
        process.exit(1);
    }

    return search;
};

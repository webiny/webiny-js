const chalk = require("chalk");
const { argv } = require("yargs");
const cosmiconfig = require("cosmiconfig");
const appFactory = require("./appFactory");

(async () => {
    // Load webiny.config.js
    const explorer = cosmiconfig("webiny");
    const { config } = await explorer.search();

    const app = appFactory(config);

    const port = argv.port || 9000;
    app.listen(port, () => {
        console.log(chalk.cyan(`🚀 Functions running on port ${port}.`));
    });
})();

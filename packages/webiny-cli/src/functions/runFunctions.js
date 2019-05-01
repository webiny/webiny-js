const chalk = require("chalk");
const { argv } = require("yargs");
const getConfig = require("./getConfig");
const appFactory = require("./appFactory");

(async () => {
    const config = await getConfig();

    const app = await appFactory(config);

    const port = argv.port || 9000;
    app.listen(port, () => {
        console.log(
            `${chalk.cyan(`🚀 Functions running on port ${port}...`)} ${chalk.grey(
                "(Hit Ctrl+C to abort)"
            )}`
        );
    });
})();

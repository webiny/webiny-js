const path = require("path");
const fs = require("fs-extra");
const camelCase = require("camelcase");

module.exports = yargs => {
    yargs.command(
        "run <command> [options]",
        "Run command defined in webiny.config.js",
        yargs => {
            yargs.positional("command", {
                describe: `Command to run in webiny.config.js`,
                type: "string"
            });
        },
        async argv => {
            // Create logger
            const context = require("./context")();

            const webinyConfig = path.resolve("webiny.config.js");
            if (fs.existsSync(webinyConfig)) {
                const config = require(webinyConfig);
                const command = camelCase(argv.command);
                if (config.commands && typeof config.commands[command] === "function") {
                    return await config.commands[command]({ ...argv.options }, context);
                }

                throw Error(`Command "${command}" is not defined in "webiny.config.js"!`);
            }

            throw Error(`"webiny.config.js" does not exist in current directory!`);
        }
    );
};

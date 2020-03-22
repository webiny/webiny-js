process.env.DEBUG = [process.env.DEBUG, "webiny-scripts"].filter(Boolean).join(",");

const path = require("path");
const fs = require("fs-extra");
const context = require("./context");

module.exports = yargs => {
    yargs.command(
        "run <command> [options...]",
        "Run command defined in webiny.config.js",
        yargs => {
            yargs.positional("command", {
                describe: `Command to run in webiny.config.js`,
                type: "string"
            });
        },
        async argv => {
            const webinyConfig = path.resolve("webiny.config.js");
            if (fs.existsSync(webinyConfig)) {
                const config = require(webinyConfig);
                if (config.commands && typeof config.commands[argv.command] === "function") {
                    return await config.commands[argv.command]({ ...argv }, context);
                }

                throw Error(`Command "${argv.command}" is not defined in "webiny.config.js"!`);
            }

            throw Error(`"webiny.config.js" does not exist in current directory!`);
        }
    );
};

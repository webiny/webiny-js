const camelCase = require("camelcase");
const findUp = require("find-up");

module.exports = {
    type: "cli-command",
    name: "cli-command-run",
    create({ yargs, context }) {
        yargs.command(
            "run <command> [options]",
            `Run command defined in webiny.config.{js,ts}.\nNote: run from folder containing webiny.config.{js,ts} file.`,
            yargs => {
                yargs.positional("command", {
                    describe: `Command to run in webiny.config.{js,ts}`,
                    type: "string"
                });
            },
            async argv => {
                const configFile = findUp.sync(["webiny.config.ts", "webiny.config.js"]);
                const config = context.import(configFile);

                const command = camelCase(argv.command);
                if (config.commands && typeof config.commands[command] === "function") {
                    return await config.commands[command]({ ...argv }, context);
                }

                throw Error(`Command "${command}" is not defined in "${configFile}"!`);
            }
        );
    }
};

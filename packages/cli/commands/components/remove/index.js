const { dim } = require("chalk");

module.exports = {
    type: "cli-command",
    name: "cli-command-remove",
    create({ yargs, context }) {
        yargs.command(
            "remove <folder>",
            `Remove resources from <folder>.\n${dim("(NOTE: run from project root)")}`,
            yargs => {
                yargs.positional("folder", {
                    describe: `Folder to remove. Requires resources.js file`,
                    type: "string"
                });

                yargs.option("env", {
                    describe: "Environment to remove.",
                    default: "local"
                });
            },
            async argv => {
                await require("./remove")({ ...argv, debug: true }, context);
                process.exit(0);
            }
        );
    }
};

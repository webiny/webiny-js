const { dim } = require("chalk");

module.exports = {
    type: "cli-command",
    name: "cli-command-remove",
    create({ yargs, context }) {
        yargs.example("$0 remove api --env=dev");
        yargs.command(
            "remove <folder>",
            `Remove resources from <folder>.\n${dim("(NOTE: run from project root)")}`,
            yargs => {
                yargs.positional("folder", {
                    describe: `Folder to remove. Requires resources.js file`,
                    type: "string"
                });

                yargs.option("env", {
                    required: true,
                    describe: "Environment to remove."
                });
            },
            async argv => {
                await require("./remove")({ ...argv, debug: true }, context);
                process.exit(0);
            }
        );
    }
};

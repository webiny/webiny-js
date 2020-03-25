const { dim } = require("chalk");

module.exports = yargs => {
    yargs.usage("usage: $0 remove <folder>").command(
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
            await require("./remove")({ ...argv, debug: true });
            process.exit(0);
        }
    );
};

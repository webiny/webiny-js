const { dim } = require("chalk");

module.exports = yargs => {
    yargs.usage("usage: $0 deploy <folder> [resources...]").command(
        "deploy <folder> [resources...]",
        `Deploy resources from <folder>.\n${dim("(NOTE: run from project root)")}`,
        yargs => {
            yargs.positional("folder", {
                describe: `Folder to deploy. Requires resources.js file`,
                type: "string"
            });
            yargs.positional("resources", {
                describe: `One or more resources to deploy`,
                type: "array"
            });
            yargs.option("env", {
                describe: `Environment to deploy`,
                type: "string",
                default: "local"
            });

            yargs.option("watch", {
                default: false,
                describe: `Watch for changes and deploy. Only works in combination with [resource].`,
                type: "boolean"
            });
        },
        async argv => {
            await require("./deploy")({ ...argv, debug: true });
            process.exit(0);
        }
    );
};

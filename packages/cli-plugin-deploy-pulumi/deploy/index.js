module.exports = (options = {}) => ({
    type: "cli-command",
    name: "cli-command-deploy",
    create({ yargs, context }) {
        yargs.example("$0 deploy api --env=dev");
        yargs.command(
            "deploy <folder> [resources...]",
            `Deploy resources from <folder>.`,
            yargs => {
                yargs.positional("folder", {
                    describe: `Folder to deploy. Requires resources.js file`,
                    type: "string"
                });
                yargs.option("env", {
                    required: true,
                    describe: `Environment to deploy`,
                    type: "string"
                });
                yargs.option("preview", {
                    required: false,
                    default: false,
                    describe: `Preview the deploy instead of actually performing it`,
                    type: "boolean"
                });
                yargs.option("build", {
                    required: false,
                    default: true,
                    describe: `Build the stack code before deploying`,
                    type: "boolean"
                });
            },
            async argv => {
                await require("./deploy")({ ...argv, debug: true, options }, context);
                process.exit(0);
            }
        );
    }
});

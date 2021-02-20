module.exports = () => ({
    type: "cli-command",
    name: "cli-command-deploy",
    create({ yargs, context }) {
        yargs.example("$0 deploy");
        yargs.command(
            "deploy",
            `Completely deploys the project by deploying the "api", "apps/admin", and "apps/website" applications, into the given environment.`,
            yargs => {
                yargs.option("env", {
                    describe: `Environment`,
                    type: "string",
                    default: "dev"
                });
                yargs.option("build", {
                    required: false,
                    default: true,
                    describe: `Build packages before deploying`,
                    type: "boolean"
                });
                yargs.option("preview", {
                    required: false,
                    default: false,
                    describe: `Preview the deploy instead of actually performing it`,
                    type: "boolean"
                });
                yargs.option("debug", {
                    required: false,
                    default: false,
                    describe: `Turn on debug logs`,
                    type: "boolean"
                });
            },
            async argv => {
                await require("./deploy")(argv, context);
                process.exit(0);
            }
        );
    }
});

module.exports = () => ({
    type: "cli-command",
    name: "cli-command-deploy-all",
    create({ yargs, context }) {
        yargs.example("$0 deploy");
        yargs.command(
            "deploy",
            `Completely deploys the project by deploying the "api", "admin", and "site" stacks, into the given environment name`,
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
            },
            async argv => {
                await require("./deploy")(argv, context);
                process.exit(0);
            }
        );
    },
    execute(args, context) {
        return require("./deploy")(args, context);
    }
});

module.exports = {
    type: "cli-command",
    name: "cli-command-destroy",
    create({ yargs, context }) {
        yargs.example("$0 destroy api --env=dev");
        yargs.command(
            "destroy <folder>",
            `destroy resources from <folder>.`,
            yargs => {
                yargs.positional("stack", {
                    describe: `Stack to destroy`,
                    type: "string"
                });

                yargs.option("env", {
                    describe: "Environment"
                });
            },
            async argv => {
                await require("./remove")({ ...argv, debug: true }, context);
                process.exit(0);
            }
        );
    }
};

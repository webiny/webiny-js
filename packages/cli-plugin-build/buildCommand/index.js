module.exports = (options = {}) => ({
    type: "cli-command",
    name: "cli-command-build",
    create({ yargs, context }) {
        yargs.example("$0 build api --env=dev");
        yargs.command(
            "build <path>",
            `build resources from <path>.`,
            yargs => {
                yargs.positional("path", {
                    required: false,
                    describe: `Path`,
                    type: "string"
                });
                yargs.option("env", {
                    describe: `Environment`,
                    type: "string"
                });
                yargs.option("debug", {
                    describe: `Debug`,
                    type: "string"
                });
            },
            async argv => {
                await require("./build")({ ...argv, options }, context);
                process.exit(0);
            }
        );
    }
});

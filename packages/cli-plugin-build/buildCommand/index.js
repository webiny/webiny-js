module.exports = (options = {}) => ({
    type: "cli-command",
    name: "cli-command-build",
    create({ yargs, context }) {
        yargs.example("$0 build api --env=dev");
        yargs.command(
            "build <folder> [resources...]",
            `build resources from <folder>.`,
            yargs => {
                yargs.positional("path", {
                    describe: `Path`,
                    type: "string"
                });
                yargs.option("env", {
                    describe: `Environment`,
                    type: "string"
                });
            },
            async argv => {
                await require("./build")({ ...argv, debug: true, options }, context);
                process.exit(0);
            }
        );
    }
});

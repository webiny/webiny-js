module.exports = {
    type: "cli-command",
    name: "cli-command-pulumi",
    create({ yargs, context }) {
        yargs.example("$0 pulumi -- config set someKey someValue --cwd apps/admin");
        yargs.command(
            "pulumi",
            `Runs a Pulumi command, as if a regular Pulumi CLI was used. Note: make sure to prefix the command with "--".`,
            () => {
                yargs.example("$0 pulumi -- config set someKey someValue --cwd apps/admin");
            },
            async argv => {
                await require("./run")(argv, context);
                process.exit(0);
            }
        );
    },
    execute(args, context) {
        return require("./run")(args, context);
    }
};

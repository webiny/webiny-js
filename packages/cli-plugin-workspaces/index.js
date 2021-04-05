module.exports = (options = {}) => ({
    type: "cli-command",
    name: "cli-command-workspaces",
    create({ yargs, context }) {
        yargs.command(
            ["workspaces <command>", "ws"],
            `Tools to work with project workspaces.`,
            wsCommand => {
                wsCommand.command(
                    "list",
                    `List all project workspaces`,
                    command => {
                        command.option("json", {
                            required: false,
                            describe: `Output as JSON`,
                            type: "boolean",
                            default: false
                        });

                        command.option("withPath", {
                            required: false,
                            describe: `Includes full workspace path in the output`,
                            type: "boolean",
                            default: false
                        });

                        command.option("scope", {
                            describe: `Only include workspaces that match specified name or glob`,
                            type: "string"
                        });

                        command.option("ignoreScope", {
                            describe: `Ignore workspaces that match specified name or glob`,
                            type: "string"
                        });

                        command.option("folder", {
                            describe: `Only include workspaces that are located withing the specified folder`,
                            type: "string"
                        });

                        command.option("ignoreFolder", {
                            describe: `Ignore workspaces located within the specified folder`,
                            type: "string"
                        });

                        command.example("$0 workspaces list");
                    },
                    async argv => {
                        await require("./commands/list")({ ...argv, options }, context);
                        process.exit(0);
                    }
                );

                wsCommand.command(
                    "tree",
                    `Returns dependencies tree for specified workspaces`,
                    command => {
                        command.option("json", {
                            required: false,
                            describe: `Output as JSON`,
                            type: "boolean",
                            default: false
                        });

                        command.option("scope", {
                            describe: `Include only workspaces that match the given scope (full package name or glob)`,
                            type: "string"
                        });

                        command.option("folder", {
                            describe: `Include only workspaces found in the specified folder`,
                            type: "string"
                        });

                        command.option("depth", {
                            describe: `Set tree depth`,
                            type: "number",
                            default: 2
                        });

                        command.option("distinct", {
                            describe: `Return an array of distinct packages found in the tree`,
                            type: "boolean",
                            default: false
                        });

                        command.example("$0 workspaces tree --scope @webiny/handler-graphql");
                    },
                    async argv => {
                        await require("./commands/tree")({ ...argv, options }, context);
                        process.exit(0);
                    }
                );

                wsCommand.command(
                    "run <script>",
                    "Run a script on one or several project workspaces",
                    command => {
                        command.positional("script", {
                            required: false,
                            describe: `Name of the script to run`,
                            type: "string"
                        });

                        command.option("scope", {
                            describe: `Include only workspaces that match the given names or globs`,
                            type: "string"
                        });

                        command.option("folder", {
                            describe: `Include only workspaces found in the specified folder`,
                            type: "string"
                        });

                        command.option("stream", {
                            describe: `Stream output to the terminal`,
                            type: "bool",
                            default: true
                        });

                        command.option("parallel", {
                            describe: `Run script in parallel, ignoring cross-package dependencies`,
                            type: "bool"
                        });

                        command.example("$0 workspaces run build ");
                        command.example("$0 workspaces run build --scope=my-package");
                    },
                    async argv => {
                        await require("./commands/run")({ ...argv, options }, context);
                        process.exit(0);
                    }
                );
            }
        );
    }
});

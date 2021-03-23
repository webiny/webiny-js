const destroy = require("./destroy");
const deploy = require("./deploy");
const output = require("./output");

module.exports = [
    {
        type: "cli-command",
        name: "cli-command-deployment",
        create({ yargs, context }) {
            yargs.example("$0 deploy api --env=dev");
            yargs.example("$0 destroy api --env=dev");
            yargs.example("$0 output api --env=dev");
            yargs.example("$0 pulumi api --env dev -- config set foo bar --secret");

            yargs.command(
                "deploy [folder]",
                `Deploys cloud infrastructure for given project application`,
                yargs => {
                    yargs.example("$0 deploy api --env=dev");
                    yargs.example("$0 deploy --env=dev");
                    yargs.positional("folder", {
                        describe: `Project application folder`,
                        type: "string"
                    });
                    yargs.option("env", {
                        describe: `Environment`,
                        type: "string"
                    });
                    yargs.option("build", {
                        default: true,
                        describe: `Build packages before deploying`,
                        type: "boolean"
                    });
                    yargs.option("preview", {
                        default: false,
                        describe: `Preview the deploy instead of actually performing it`,
                        type: "boolean"
                    });
                    yargs.option("debug", {
                        default: false,
                        describe: `Turn on debug logs`,
                        type: "boolean"
                    });
                },
                async argv => {
                    await deploy(argv, context);
                    process.exit(0);
                }
            );

            yargs.command(
                "destroy <folder>",
                `Destroys deployed cloud infrastructure for given project application`,
                yargs => {
                    yargs.example("$0 destroy api --env=dev");
                    yargs.positional("folder", {
                        describe: `Project application folder`,
                        type: "string"
                    });
                    yargs.option("env", {
                        required: true,
                        describe: `Environment`,
                        type: "string"
                    });
                    yargs.option("debug", {
                        default: false,
                        describe: `Turn on debug logs`,
                        type: "boolean"
                    });
                },
                async argv => {
                    await destroy(argv, context);
                    process.exit(0);
                }
            );

            yargs.command(
                "output <folder>",
                `Prints deployed cloud infrastructure' output for given project application and environment`,
                yargs => {
                    yargs.example("$0 output api --env=dev --json");
                    yargs.positional("folder", {
                        describe: `Project application folder`,
                        type: "string"
                    });
                    yargs.option("env", {
                        required: true,
                        describe: `Environment`,
                        type: "string"
                    });
                    yargs.option("json", {
                        describe: `Emit output as JSON`,
                        type: "boolean"
                    });
                    yargs.option("debug", {
                        default: false,
                        describe: `Turn on debug logs`,
                        type: "boolean"
                    });
                },
                async argv => {
                    await output(argv, context);
                    process.exit(0);
                }
            );

            yargs.command(
                "pulumi <folder>",
                `Runs a Pulumi command in the provided project application folder. Note: make sure to use "--" before the actual Pulumi command.`,
                () => {
                    yargs.example("$0 pulumi api --env dev -- config set foo bar --secret");

                    yargs.positional("folder", {
                        describe: `Project application folder`,
                        type: "string"
                    });

                    yargs.option("env", {
                        describe: `Environment`,
                        type: "string"
                    });
                },
                async argv => {
                    await require("./pulumiRun")(argv, context);
                    process.exit(0);
                }
            );
        }
    }
];

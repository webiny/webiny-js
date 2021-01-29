const destroy = require("./destroy");
const deploy = require("./deploy");
const output = require("./output");

module.exports = [
    {
        type: "cli-command",
        name: "cli-command-app",
        create({ yargs, context }) {
            yargs.command("app", `Run various commands on given project application.`, yargs => {
                yargs.example("$0 app deploy api --env=dev");
                yargs.example("$0 app destroy api --env=dev");
                yargs.example("$0 app output api --env=dev");
                yargs.command(
                    "deploy <folder>",
                    `Deploys cloud infrastructure for given project application`,
                    yargs => {
                        yargs.example("$0 app deploy api --env=dev");
                        yargs.positional("folder", {
                            describe: `Project application folder`,
                            type: "string"
                        });
                        yargs.option("env", {
                            required: true,
                            describe: `Environment`,
                            type: "string"
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
                        await deploy(argv, context);
                        process.exit(0);
                    }
                );

                yargs.command(
                    "destroy <folder>",
                    `Destroys deployed cloud infrastructure for given project application`,
                    yargs => {
                        yargs.example("$0 app destroy api --env=dev");
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
                            required: false,
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
                        yargs.example("$0 app output api --env=dev --json");
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
                            required: false,
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
            });
        }
    }
];

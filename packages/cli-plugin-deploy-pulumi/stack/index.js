const destroy = require("./destroy");
const deploy = require("./deploy");
const output = require("./output");

module.exports = [
    {
        type: "cli-command",
        name: "cli-command-stack",
        create({ yargs, context }) {
            yargs.command("stack", `Run various commands on given stack.`, yargs => {
                yargs.example("$0 stack deploy api --env=dev");
                yargs.example("$0 stack destroy api --env=dev");
                yargs.example("$0 stack output api --env=dev");
                yargs.command(
                    "deploy <stack>",
                    `Deploys given stack`,
                    yargs => {
                        yargs.example("$0 stack deploy api --env=dev");
                        yargs.positional("stack", {
                            describe: `Stack to deploy`,
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
                    "destroy <stack>",
                    `Destroys given stack`,
                    yargs => {
                        yargs.example("$0 stack destroy api --env=dev");
                        yargs.positional("stack", {
                            describe: `Stack to deploy`,
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
                    "output <stack>",
                    `Prints stack output`,
                    yargs => {
                        yargs.example("$0 stack output api --env=dev --json");
                        yargs.positional("stack", {
                            describe: `Stack to print`,
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
        },
        execute(args, context) {
            return require("./deploy")(args, context);
        }
    }
];

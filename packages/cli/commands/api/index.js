module.exports = yargs => {
    yargs
        .usage("usage: $0 api <command> [options]")
        .command("api [deploy|remove]", "API commands", yargs => {
            yargs.command(
                "deploy [resource...]",
                "Deploy API",
                yargs => {
                    yargs.option("resource", {
                        describe: `Resources to deploy`,
                        type: "array"
                    });
                    yargs.option("env", {
                        describe: `Environment to deploy`,
                        type: "string",
                        default: "local"
                    });
                    /*yargs.option("debug", {
                        default: true,
                        describe: `Show debug output`,
                        type: "boolean"
                    });*/
                    yargs.option("watch", {
                        default: false,
                        describe: `Watch for changes and deploy. Only works in combination with [resource].`,
                        type: "boolean"
                    });
                },
                async argv => {
                    await require("./deploy")({ ...argv, debug: true });
                    process.exit(0);
                }
            );

            yargs.command("remove", "Remove API", () => {
                console.log("Removing API");
            });
        });
};

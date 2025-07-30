const { getStackOutput } = require("@webiny/cli-plugin-deploy-pulumi/utils/getStackOutput");
const open = require("open");

module.exports = {
    type: "cli-command",
    name: "cli-command-open",
    create({ yargs, context }) {
        yargs.command(
            "open <app>",
            `Quickly open Admin application in your default browser`,
            yargs => {
                yargs.option("env", {
                    describe: `Environment`,
                    type: "string",
                    required: true
                });
                yargs.option("variant", {
                    describe: `Variant`,
                    type: "string",
                    required: false
                });
            },
            async args => {
                const appName = "Admin app";
                context.info(`Opening ${appName}...`);

                let appOutput = getStackOutput({
                    folder: "admin",
                    env: args.env,
                    variant: args.variant
                });

                if (!appOutput) {
                    throw new Error(
                        `Could not retrieve URL for ${appName}. Please make sure you've deployed the project first.`
                    );
                }

                const { appUrl } = appOutput;

                return new Promise(resolve => {
                    setTimeout(() => {
                        context.success(`Successfully opened ${appName}.`);
                        open(appUrl);
                        resolve();
                    }, 1000);
                });
            }
        );
    }
};

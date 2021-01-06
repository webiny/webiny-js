const getStackOutput = require("../utils/getStackOutput");
const { green } = require("chalk");

module.exports = {
    type: "cli-command",
    name: "cli-command-info",
    create({ yargs }) {
        yargs.command(
            "info",
            `Lists all relevant URLs for your deployed stacks/environments`,
            yargs => {
                yargs.option("env", {
                    describe: `Environment`,
                    type: "string",
                    required: true
                });
                yargs.option("debug", {
                    describe: `Debug`,
                    type: "string"
                });
            },
            async args => {
                const { env } = args;

                let stacksDeployedCount = 0;
                let output = await getStackOutput("api", env);
                if (output) {
                    stacksDeployedCount++;
                    console.log(
                        [
                            `🔗 Main GraphQL API: ${green(output.apiUrl + "/graphql")}`,
                            `🔗 CMS GraphQL API:`,
                            `   - Content Delivery API: ${green(
                                output.apiUrl + "/cms/read/{LOCALE_CODE}"
                            )}`,
                            `   - Content Preview API: ${green(
                                output.apiUrl + "/cms/preview/{LOCALE_CODE}"
                            )}`
                        ].join("\n")
                    );
                } else {
                    console.log(`Stack ${green("api")} not deployed yet.`);
                }

                output = await getStackOutput("apps/admin", env);
                if (output) {
                    stacksDeployedCount++;
                    console.log([`🔗 Admin app: ${green(output.appUrl)}`].join("\n"));
                } else {
                    console.log(`Stack ${green("apps/admin")} not deployed yet.`);
                }

                output = await getStackOutput("apps/site", env);
                if (output) {
                    stacksDeployedCount++;
                    console.log(
                        [
                            `🔗 Public website: ${green(output.appUrl)}`,
                            `   - App: ${green(output.appUrl)}`,
                            `   - Delivery: ${green(output.deliveryUrl)}`
                        ].join("\n")
                    );
                } else {
                    console.log(`Stack ${green("apps/site")} not deployed yet.`);
                }

                if (stacksDeployedCount === 0) {
                    console.log();
                    console.log(
                        "It seems none of the stacks were deployed, so no info could be provided."
                    );
                    console.log(
                        `Please check if the provided environment ${green(env)} is correct.`
                    );
                }
            }
        );
    }
};

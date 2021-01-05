const getStackOutputs = require("../utils/getStackOutputs");
const stackExists = require("../utils/stackExists");
const { green } = require("chalk");
const { resolve, join } = require("path");

module.exports = {
    type: "cli-command",
    name: "cli-command-info",
    create({ yargs, context }) {
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
                const { env, debug } = args;

                const projectRoot = context.paths.projectRoot;
                const apiStackDir = join(projectRoot, "api");
                const appsAdminStackDir = join(projectRoot, "apps", "admin");
                const appsSiteStackDir = join(projectRoot, "apps", "site");

                // Load .env.json from project root.
                await context.loadEnv(resolve(projectRoot, ".env.json"), env, { debug });

                // Load .env.json from cwd (this will change depending on the folder you specified).
                await context.loadEnv(resolve(apiStackDir, ".env.json"), env, { debug });

                let notDeployedCount = 0;
                if (await stackExists(apiStackDir, env)) {
                    const outputs = await getStackOutputs(apiStackDir, env);
                    console.log(
                        [
                            `🔗 Main GraphQL API: ${green(outputs.apiUrl + "/graphql")}`,
                            `🔗 CMS GraphQL API:`,
                            `   - Content Delivery API: ${green(
                                outputs.apiUrl + "/cms/read/{LOCALE_CODE}"
                            )}`,
                            `   - Content Preview API: ${green(
                                outputs.apiUrl + "/cms/preview/{LOCALE_CODE}"
                            )}`
                        ].join("\n")
                    );
                } else {
                    console.log(`Stack ${green("api")} not deployed yet.`);
                    notDeployedCount++;
                }

                if (await stackExists(appsAdminStackDir, env)) {
                    const outputs = await getStackOutputs(appsAdminStackDir, env);
                    console.log([`🔗 Admin app: ${green(outputs.appUrl)}`].join("\n"));
                } else {
                    console.log(`Stack ${green("apps/admin")} not deployed yet.`);
                    notDeployedCount++;
                }

                if (await stackExists(appsSiteStackDir, env)) {
                    const outputs = await getStackOutputs(appsSiteStackDir, env);
                    console.log(
                        [
                            `🔗 Public website: ${green(outputs.appUrl)}`,
                            `   - App: ${green(outputs.appUrl)}`,
                            `   - Delivery: ${green(outputs.deliveryUrl)}`
                        ].join("\n")
                    );
                } else {
                    console.log(`Stack ${green("apps/site")} not deployed yet.`);
                    notDeployedCount++;
                }

                if (notDeployedCount === 3) {
                    console.log()
                    console.log(
                        "It seems none of the stacks were deployed, so no info could be provided."
                    );
                    console.log(`Please check if the provided environment ${green(env)} is correct.`);
                }
            }
        );
    }
};

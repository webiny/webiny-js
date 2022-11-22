const getStackOutput = require("@webiny/cli-plugin-deploy-pulumi/utils/getStackOutput");
const { green } = require("chalk");
const path = require("path");
const fs = require("fs");

const line = `-------------------------`;

// This function has been created in order to help preserve backwards compatibility
// (from 5.29.0, the `api` app has been moved into the `apps/api` directory).
const getApiFolder = context => {
    if (fs.existsSync(path.join(context.project.root, "api"))) {
        return "api";
    }

    return "apps/api";
};

const printEnvOutput = async (env, context) => {
    console.log(line);
    console.log(`Environment: ${green(env)}`);
    console.log(line);

    const apiFolder = getApiFolder(context);

    let stacksDeployedCount = 0;
    let output = getStackOutput({ folder: apiFolder, env });
    if (output) {
        stacksDeployedCount++;
        console.log(
            [
                `➜ Main GraphQL API: ${green(output.apiUrl + "/graphql")}`,
                `➜ Headless CMS GraphQL API:`,
                `   - Manage API: ${green(output.apiUrl + "/cms/manage/{LOCALE_CODE}")}`,
                `   - Read API: ${green(output.apiUrl + "/cms/read/{LOCALE_CODE}")}`,
                `   - Preview API: ${green(output.apiUrl + "/cms/preview/{LOCALE_CODE}")}`
            ].join("\n")
        );
    } else {
        context.info(`Stack ${green(apiFolder)} not deployed yet.`);
    }

    output = getStackOutput({ folder: "apps/admin", env });
    if (output) {
        stacksDeployedCount++;
        console.log([`➜ Admin app: ${green(output.appUrl)}`].join("\n"));
    } else {
        context.info(`Stack ${green("apps/admin")} not deployed yet.`);
    }

    output = getStackOutput({ folder: "apps/website", env });
    if (output) {
        stacksDeployedCount++;
        console.log(
            [
                `➜ Public website:`,
                `   - Website URL: ${green(output.deliveryUrl)}`,
                `   - Website preview URL: ${green(output.appUrl)}`
            ].join("\n")
        );
    } else {
        context.info(`Stack ${green("apps/website")} not deployed yet.`);
    }

    if (stacksDeployedCount === 0) {
        context.info("It seems none of the stacks were deployed, so no info could be provided.");
        context.info(`Please check if the provided environment ${green(env)} is correct.`);
    }

    console.log(line + "\n");
};

module.exports = {
    type: "cli-command",
    name: "cli-command-info",
    create({ yargs, context }) {
        yargs.command(
            "info",
            `Lists all relevant URLs for deployed project applications.`,
            yargs => {
                yargs.option("env", {
                    describe: `Environment (required if Pulumi state files are not stored locally)`,
                    type: "string",
                    required: false
                });
                yargs.option("debug", {
                    describe: `Debug`,
                    type: "string"
                });
            },
            async args => {
                const { env } = args;
                if (!env) {
                    // Get all existing environments
                    const glob = require("fast-glob");

                    // We just get stack files for deployed Admin apps. That's enough to determine
                    // into which environments the user has deployed their Webiny project.
                    const pulumiAdminStackFilesPaths = glob.sync(
                        ".pulumi/**/apps/admin/.pulumi/stacks/*.json",
                        {
                            cwd: context.project.root,
                            onlyFiles: true,
                            dot: true
                        }
                    );

                    const existingEnvs = pulumiAdminStackFilesPaths.map(current =>
                        path.basename(current, ".json")
                    );

                    for (const env of existingEnvs) {
                        await printEnvOutput(env, context);
                    }

                    return;
                }

                await printEnvOutput(env, context);
            }
        );
    }
};

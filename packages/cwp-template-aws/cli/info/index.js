const getStackOutput = require("@webiny/cli-plugin-deploy-pulumi/utils/getStackOutput");
const path = require("path");
const { blue } = require("chalk");

const getInfo = async env => {
    const apiOutputPromise = new Promise(resolve => {
        resolve(getStackOutput({ folder: "apps/api", env }));
    });

    const adminOutputPromise = new Promise(resolve => {
        resolve(getStackOutput({ folder: "apps/admin", env }));
    });

    const websiteOutputPromise = new Promise(resolve => {
        resolve(getStackOutput({ folder: "apps/website", env }));
    });

    const outputs = await Promise.all([apiOutputPromise, adminOutputPromise, websiteOutputPromise]);

    const stacksDeployedCount = outputs.filter(Boolean).length;

    if (stacksDeployedCount === 0) {
        return [
            "It seems none of the stacks were deployed, so no info could be provided.",
            `Please check if the provided environment ${env} is correct.`
        ].join(" ");
    }

    const [api, admin, website] = outputs;

    const output = [];

    // API.
    if (api) {
        output.push(
            `‣ Environment name: ${blue(env)}`,
            `‣ AWS region: ${api?.region}`,
            `‣ Main GraphQL API: ${api.apiUrl + "/graphql"}`,
            `‣ Headless CMS GraphQL API:`,
            `   · Manage API: ${api.apiUrl + "/cms/manage/{LOCALE_CODE}"}`,
            `   · Read API: ${api.apiUrl + "/cms/read/{LOCALE_CODE}"}`,
            `   · Preview API: ${api.apiUrl + "/cms/preview/{LOCALE_CODE}"}`
        );
    } else {
        output.push(
            `‣ Environment name: -`,
            `‣ AWS region: -`,
            `‣ Main GraphQL API: -`,
            `‣ Headless CMS GraphQL API:`,
            `   · Manage API: -`,
            `   · Read API: -`,
            `   · Preview API: -`
        );
    }

    // Admin.
    if (admin) {
        output.push(`‣ Admin app: ${admin.appUrl}`);
    } else {
        output.push(`‣ Admin app: -`);
    }

    // Website.
    if (website) {
        output.push(
            `‣ Public website:`,
            `   · Website URL: ${website.deliveryUrl}`,
            `   · Website preview URL: ${website.appUrl}`
        );
    } else {
        output.push(`‣ Public website:`, `   · Website URL: -`, `   · Website preview URL: -`);
    }

    return output.join("\n");
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

                    // We just get stack files for deployed Core application. That's enough
                    // to determine into which environments the user has deployed their project.
                    const pulumiAdminStackFilesPaths = glob.sync(
                        ".pulumi/**/apps/core/.pulumi/stacks/**/*.json",
                        {
                            cwd: context.project.root,
                            onlyFiles: true,
                            dot: true
                        }
                    );

                    const existingEnvs = pulumiAdminStackFilesPaths.map(current =>
                        path.basename(current, ".json")
                    );

                    if (existingEnvs.length === 0) {
                        context.info(
                            "It seems that no environments have been deployed yet. Please deploy the project first."
                        );
                        return;
                    }

                    if (existingEnvs.length === 1) {
                        context.info("There is one deployed environment.");
                        context.info("Here is the information for the environment.");
                    } else {
                        context.info(
                            "There's a total of %d deployed environments.",
                            existingEnvs.length
                        );
                        context.info("Here is the information for each environment.");
                        console.log();
                    }

                    for (const env of existingEnvs) {
                        console.log(await getInfo(env, context));
                        console.log();
                    }
                } else {
                    console.log(await getInfo(env, context));
                    console.log();
                }

                context.info(
                    "If some of the information is missing for a particular environment, make sure that the project has been fully deployed into that environment. You can do that by running the %s command.",
                    "yarn webiny deploy --env {ENVIRONMENT_NAME}"
                );
            }
        );
    }
};

module.exports.getInfo = getInfo;

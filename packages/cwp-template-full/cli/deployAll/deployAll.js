const { green } = require("chalk");
const { resolve, join } = require("path");
const getStackOutputs = require("../utils/getStackOutputs");
const stackExists = require("../utils/stackExists");
const sleep = require("../utils/sleep");

module.exports = async (inputs, context) => {
    const { env, debug = true } = inputs;

    const projectRoot = context.paths.projectRoot;
    const apiStackDir = join(projectRoot, "api");
    const appsAdminStackDir = join(projectRoot, "apps", "admin");
    const appsSiteStackDir = join(projectRoot, "apps", "site");

    if (env) {
        // Load .env.json from project root.
        await context.loadEnv(resolve(projectRoot, ".env.json"), env, { debug });

        // Load .env.json from cwd (this will change depending on the folder you specified).
        await context.loadEnv(resolve(apiStackDir, ".env.json"), env, { debug });
    }

    // 1. Get exports from `site` stack, for `args.env` environment.
    const apiStackExists = await stackExists(apiStackDir, env);
    const isFirstDeployment = !apiStackExists;
    if (isFirstDeployment) {
        console.log(
            `⏳  We've detected this is your first time deploying the project (${green(
                env
            )} environment). Note that the initial deployment can take up to 15 minutes, so please be patient.`
        );

        await sleep();
    }

    const deployPlugin = context.plugins.byName("cli-command-deploy");

    // Deploying `api` stack.
    console.log();
    if (isFirstDeployment) {
        console.log(`🚀 Deploying your ${green("API")} (${green("api")} stack)...`);
    } else {
        console.log(`🚀 Deploying ${green("api")} stack...`);
    }

    await deployPlugin.execute({ stack: "api", env: inputs.env, build: inputs.build }, context);
    if (isFirstDeployment) {
        console.log(
            `🎉 Your ${green("API")} was deployed successfully! Continuing with the apps...`
        );
        await sleep(2000);
    } else {
        console.log(`🎉 ${green("api")} stack deployed successfully.`);
    }

    // Deploying `apps/admin` stack.
    console.log();
    if (isFirstDeployment) {
        console.log(`🚀 Deploying your ${green("Admin")} app (${green("apps/admin")} stack)...`);
        await sleep();
    } else {
        console.log(`🚀 Deploying ${green("apps/admin")} stack...`);
    }

    await deployPlugin.execute(
        { stack: "apps/admin", env: inputs.env, build: inputs.build },
        context
    );

    if (isFirstDeployment) {
        console.log(`🎉 Your ${green("Admin")} app was deployed successfully!`);
    } else {
        console.log(`🎉 ${green("apps/admin")} stack deployed successfully.`);
    }

    // Deploying `apps/admin` stack.
    console.log();
    if (isFirstDeployment) {
        console.log(
            `🚀 Deploying your ${green("public website")} app (${green("apps/site")} stack)...`
        );
        await sleep();
    } else {
        console.log(`🚀 Deploying ${green("apps/site")} stack...`);
    }

    await deployPlugin.execute(
        { stack: "apps/site", env: inputs.env, build: inputs.build },
        context
    );

    if (isFirstDeployment) {
        console.log(`🎉 Your ${green("public website")} app was deployed successfully!`);
    } else {
        console.log(`🎉 ${green("apps/site")} stack deployed successfully.`);
    }

    const outputs = {
        api: await getStackOutputs(apiStackDir, env),
        apps: {
            admin: await getStackOutputs(appsAdminStackDir, env),
            site: await getStackOutputs(appsSiteStackDir, env)
        }
    };

    const usefulLinks = [
        `🔗 Main GraphQL API: ${green(outputs.api.apiUrl + "/graphql")}`,
        `🔗 Admin app: ${green(outputs.apps.admin.appUrl)}`,
        `🔗 Public website: ${green(outputs.apps.site.appUrl)}`,
        `   - App: ${green(outputs.apps.site.appUrl)}`,
        `   - Delivery: ${green(outputs.apps.site.deliveryUrl)}`
    ].join("\n");

    console.log();
    if (isFirstDeployment) {
        console.log(
            [
                `🎉 Congratulations! You've just deployed a brand new project (${green(
                    env
                )} environment)!`,
                "",
                `To finish the setup, please open your ${green('Admin')} app (${green(
                    outputs.apps.admin.appUrl
                )}) and complete the installation wizard. To learn more, visit ${green(
                    "https://docs.webiny.com"
                )}.`
            ].join("\n")
        );
    } else {
        console.log(
            [
                usefulLinks,
                "",
                `💡 Tip: to deploy stacks separately, use the ${green(
                    "deploy"
                )} command (e.g. ${green(
                    `yarn webiny deploy apps/site --env ${env}`
                )}). For additional help, please run ${green("yarn webiny --help")}.`
            ].join("\n")
        );
    }
};

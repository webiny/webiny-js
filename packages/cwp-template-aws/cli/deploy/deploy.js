const { green } = require("chalk");
const { getStackOutput, getPulumi } = require("@webiny/cli-plugin-deploy-pulumi/utils");
const sleep = require("../utils/sleep");
const execa = require("execa");

const deploy = (stack, inputs) => {
    return execa(
        "webiny",
        [
            "stack",
            "deploy",
            stack,
            "--env",
            inputs.env,
            "--debug",
            Boolean(inputs.debug),
            "--build",
            Boolean(inputs.build)
        ],
        {
            stdio: "inherit"
        }
    );
};

module.exports = async (inputs, context) => {
    const { env } = inputs;

    // 0. Let's just make sure Pulumi is installed.
    const installed = await getPulumi().install();

    // If we just installed Pulumi, let's add a new line.
    installed && console.log();

    // 1. Get exports from `site` stack, for `args.env` environment.
    const siteStackOutput = await getStackOutput("apps/site", env);
    const isFirstDeployment = !siteStackOutput;
    if (isFirstDeployment) {
        context.info(
            `This is your first time deploying the project (${green(
                env
            )} environment). Note that the initial deployment can take up to 15 minutes, so please be patient.`
        );

        await sleep();
    }

    // Deploying `api` stack.
    if (isFirstDeployment) {
        console.log();
        context.info(`Deploying your ${green("API")} (${green("api")} stack)...`);
    } else {
        context.info(`Deploying ${green("api")} stack...`);
    }

    await deploy("api", inputs);

    if (isFirstDeployment) {
        context.success(
            `Your ${green("API")} was deployed successfully! Continuing with the apps...`
        );
        await sleep(2000);
    } else {
        context.success(`${green("api")} stack deployed successfully.`);
    }

    // Deploying `apps/admin` stack.
    console.log();
    if (isFirstDeployment) {
        context.info(`Deploying your ${green("Admin")} app (${green("apps/admin")} stack)...`);
        await sleep();
    } else {
        context.info(`Deploying ${green("apps/admin")} stack...`);
    }

    await deploy("apps/admin", inputs);

    if (isFirstDeployment) {
        context.success(`Your ${green("Admin")} app was deployed successfully!`);
    } else {
        context.success(`${green("apps/admin")} stack deployed successfully.`);
    }

    // Deploying `apps/admin` stack.
    console.log();
    if (isFirstDeployment) {
        context.info(
            `Deploying your ${green("public website")} app (${green("apps/site")} stack)...`
        );
        await sleep();
    } else {
        context.info(`Deploying ${green("apps/site")} stack...`);
    }

    await deploy("apps/site", inputs);

    if (isFirstDeployment) {
        context.success(`Your ${green("public website")} app was deployed successfully!`);
    } else {
        context.success(`${green("apps/site")} stack deployed successfully.`);
    }

    const outputs = {
        api: await getStackOutput("api", env),
        apps: {
            admin: await getStackOutput("apps/admin", env),
            site: await getStackOutput("apps/site", env)
        }
    };

    console.log();
    if (isFirstDeployment) {
        console.log(
            [
                `Congratulations! You've just deployed a brand new project (${green(
                    env
                )} environment)!`,
                "",
                `To finish the setup, please open your ${green("Admin")} app (${green(
                    outputs.apps.admin.appUrl
                )}) and complete the installation wizard. To learn more, visit ${green(
                    "https://docs.webiny.com"
                )}.`
            ].join("\n")
        );
    } else {
        const usefulLinks = [
            `➜ Main GraphQL API: ${green(outputs.api.apiUrl + "/graphql")}`,
            `➜ Admin app: ${green(outputs.apps.admin.appUrl)}`,
            `➜ Public website:`,
            `   - Website URL: ${green(outputs.apps.site.deliveryUrl)}`,
            `   - Website preview URL: ${green(outputs.apps.site.appUrl)}`
        ].join("\n");

        console.log(
            [
                usefulLinks,
                "",
                `💡 Tip: to deploy stacks separately, use the ${green(
                    "stack deploy"
                )} command (e.g. ${green(
                    `yarn webiny stack deploy apps/site --env ${env}`
                )}). For additional help, please run ${green("yarn webiny --help")}.`
            ].join("\n")
        );
    }
};

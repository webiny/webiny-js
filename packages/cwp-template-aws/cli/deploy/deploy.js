const { green } = require("chalk");
const { getStackOutput, getPulumi } = require("@webiny/cli-plugin-deploy-pulumi/utils");
const sleep = require("../utils/sleep");
const execa = require("execa");

const deploy = (stack, inputs) => {
    return execa(
        "yarn",
        [
            "webiny",
            "app",
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
    const apiStackOutput = await getStackOutput("api", env);
    const appsAdmin = await getStackOutput("apps/admin", env);
    const appsWebsite = await getStackOutput("apps/website", env);
    const isFirstDeployment = !apiStackOutput && !appsAdmin && !appsWebsite;
    if (isFirstDeployment) {
        context.info(
            `This is your first time deploying the project (${green(
                env
            )} environment). Note that the initial deployment can take up to 15 minutes, so please be patient.`
        );

        await sleep();
    }

    // Deploying `api` project application.
    isFirstDeployment && console.log();
    context.info(`Deploying ${green("api")} project application...`);

    await deploy("api", inputs);
    context.success(`${green("api")} project application was deployed successfully!`);
    isFirstDeployment && (await sleep(2000));

    // Deploying `apps/admin` project application.
    console.log();
    context.info(`Deploying ${green("apps/admin")} project application...`);
    isFirstDeployment && (await sleep());

    await deploy("apps/admin", inputs);
    context.success(`${green("apps/admin")} project application was deployed successfully!`);

    // Deploying `apps/admin` project application.
    console.log();
    context.info(`Deploying ${green("apps/website")} project application...`);
    isFirstDeployment && (await sleep());

    await deploy("apps/website", inputs);
    context.success(`${green("apps/website")} project application was deployed successfully!`);

    const outputs = {
        api: await getStackOutput("api", env),
        apps: {
            admin: await getStackOutput("apps/admin", env),
            site: await getStackOutput("apps/website", env)
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
                `💡 Tip: to deploy project applications separately, use the ${green(
                    "app deploy"
                )} command (e.g. ${green(
                    `yarn webiny app deploy apps/website --env ${env}`
                )}). For additional help, please run ${green("yarn webiny --help")}.`
            ].join("\n")
        );
    }
};

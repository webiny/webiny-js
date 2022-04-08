const { green } = require("chalk");
const { getStackOutput, getPulumi } = require("@webiny/cli-plugin-deploy-pulumi/utils");
const { sendEvent } = require("@webiny/cli/utils");
const execa = require("execa");
const sleep = require("../utils/sleep");

const deploy = (stack, env, inputs) =>
    execa(
        "yarn",
        [
            "webiny",
            "deploy",
            stack,
            "--env",
            env,
            "--debug",
            Boolean(inputs.debug),
            "--build",
            Boolean(inputs.build),
            "--preview",
            Boolean(inputs.preview)
        ],
        {
            stdio: "inherit"
        }
    );

module.exports = async (inputs, context) => {
    const { env = "dev" } = inputs;

    // 0. Let's just make sure Pulumi is installed. But, let skip installation starting internally.
    const pulumi = await getPulumi({ install: false });

    // 0.1 Calling the install manually here, we get to know if the installation was initiated or not.
    const installed = await pulumi.install();

    // If we just installed Pulumi, let's add a new line.
    installed && console.log();

    // 1. Get exports from `website` stack, for `args.env` environment.
    const apiOutput = getStackOutput({ folder: "api", env });
    const adminOutput = getStackOutput({ folder: "apps/admin", env });
    const websiteOutput = getStackOutput({ folder: "apps/website", env });
    const isFirstDeployment = !apiOutput && !adminOutput && !websiteOutput;
    if (isFirstDeployment) {
        context.info(
            `This is your first time deploying the project (${green(
                env
            )} environment). Note that the initial deployment can take up to 15 minutes, so please be patient.`
        );

        await sleep();
    }

    try {
        await sendEvent({ event: "project-deploy-start" });

        // Deploying `api` project application.
        isFirstDeployment && console.log();
        context.info(`Deploying ${green("api")} project application...`);

        await deploy("api", env, inputs);
        context.success(`${green("api")} project application was deployed successfully!`);
        isFirstDeployment && (await sleep(2000));

        // Deploying `apps/admin` project application.
        console.log();
        context.info(`Deploying ${green("apps/admin")} project application...`);
        isFirstDeployment && (await sleep());

        await deploy("apps/admin", env, inputs);
        context.success(`${green("apps/admin")} project application was deployed successfully!`);

        // Deploying `apps/admin` project application.
        console.log();
        context.info(`Deploying ${green("apps/website")} project application...`);
        isFirstDeployment && (await sleep());

        await deploy("apps/website", env, inputs);
        context.success(`${green("apps/website")} project application was deployed successfully!`);

        await sendEvent({ event: "project-deploy-end" });
    } catch (e) {
        await sendEvent({
            event: "project-deploy-error",
            properties: {
                errorMessage: e.message,
                errorStack: e.stack
            }
        });

        throw e;
    }

    const outputs = {
        api: getStackOutput({ folder: "api", env }),
        apps: {
            admin: getStackOutput({ folder: "apps/admin", env }),
            site: getStackOutput({ folder: "apps/website", env })
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
                    "https://www.webiny.com/docs"
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
                    "deploy"
                )} command (e.g. ${green(
                    `yarn webiny deploy apps/website --env ${env}`
                )}). For additional help, please run ${green("yarn webiny --help")}.`
            ].join("\n")
        );
    }
};

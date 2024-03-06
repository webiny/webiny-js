const { green } = require("chalk");
const {
    getStackOutput,
    getPulumi,
    GracefulPulumiError
} = require("@webiny/cli-plugin-deploy-pulumi/utils");
const { sendEvent } = require("@webiny/cli/utils");
const sleep = require("../utils/sleep");
const deployCommand = require("@webiny/cli-plugin-deploy-pulumi/commands/deploy");

const deploy = (appName, inputs, context) => {
    return deployCommand(
        {
            ...inputs,
            folder: appName,
            env: inputs.env || "dev",
            telemetry: false
        },
        context
    );
};

const getTelemetryEventName = stage => `cli-project-deploy-${stage}`;

module.exports = async (inputs, context) => {
    const eventName = getTelemetryEventName("start");
    await sendEvent(eventName);

    try {
        const { env = "dev" } = inputs;

        // 1. Check if Pulumi is installed. By calling the `install` method
        // manually, we get to know if the installation was initiated or not.
        const pulumi = await getPulumi({ install: false });
        const installed = await pulumi.install();

        // If we just installed Pulumi, let's add a new line.
        installed && console.log();

        // 2. Check if first deployment.
        const isFirstDeployment = !getStackOutput({ folder: "core", env });
        if (isFirstDeployment) {
            context.info(
                `This is your first time deploying the project (${green(
                    env
                )} environment). Note that the initial deployment can take up to 15 minutes, so please be patient.`
            );

            await sleep();
        }

        // 3. Start deploying apps one-by-one.

        // Deploying `core` project application.
        isFirstDeployment && console.log();
        context.info(`Deploying ${green("Core")} project application...`);

        await deploy("apps/core", inputs, context);
        context.success(`${green("Core")} project application was deployed successfully!`);
        isFirstDeployment && (await sleep(2000));

        // Deploying `api` project application.
        console.log();
        context.info(`Deploying ${green("API")} project application...`);

        await deploy("apps/api", inputs, context);

        context.success(`${green("API")} project application was deployed successfully!`);
        isFirstDeployment && (await sleep(2000));

        // Deploying `apps/admin` project application.
        console.log();
        context.info(`Deploying ${green("Admin")} project application...`);
        isFirstDeployment && (await sleep());

        await deploy("apps/admin", inputs, context);
        context.success(`${green("Admin")} project application was deployed successfully!`);

        // Deploying `apps/admin` project application.
        console.log();
        context.info(`Deploying ${green("Website")} project application...`);
        isFirstDeployment && (await sleep());

        await deploy("apps/website", inputs, context);
        context.success(`${green("Website")} project application was deployed successfully!`);

        const outputs = {
            api: getStackOutput({ folder: "apps/api", env }),
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
                        `yarn webiny deploy website --env ${env}`
                    )}). For additional help, please run ${green("yarn webiny --help")}.`
                ].join("\n")
            );
        }

        const eventName = getTelemetryEventName("end");
        await sendEvent(eventName);
    } catch (e) {
        if (e instanceof GracefulPulumiError) {
            const eventName = getTelemetryEventName("error-graceful");
            await sendEvent(eventName, {
                errorMessage: e.message,
                errorStack: e.stack
            });
        } else {
            const eventName = getTelemetryEventName("error");
            await sendEvent(eventName, {
                errorMessage: e.message,
                errorStack: e.stack
            });
        }

        throw e;
    }
};

const fs = require("fs");
const { green } = require("chalk");
const { getStackOutput, getPulumi } = require("@webiny/cli-plugin-deploy-pulumi/utils");
const { sendEvent, getApiProjectApplicationFolder } = require("@webiny/cli/utils");
const path = require("path");
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

    // 1. By calling the install manually here, we get to know if the installation was initiated or not.
    const pulumi = await getPulumi({ install: false });

    const installed = await pulumi.install();

    // If we just installed Pulumi, let's add a new line.
    installed && console.log();

    // 2. Check if first deployment.

    // 2.1 Check the location of `api` project application (can be `api` or `apps/api`).
    const apiFolder = getApiProjectApplicationFolder(context.project);

    // 2.2 We want to be backwards compatible. That's why we need to take into
    // consideration that some projects do not have the `core` application.
    const hasCore = fs.existsSync(path.join(context.project.root, "apps", "core"));

    // If we have at least `core` output or `api` output,
    // then we can be sure this is not the first deployment.
    let isFirstDeployment;
    if (hasCore) {
        isFirstDeployment = !getStackOutput({ folder: "apps/core", env });
    } else {
        isFirstDeployment = !getStackOutput({ folder: apiFolder, env });
    }

    if (isFirstDeployment) {
        context.info(
            `This is your first time deploying the project (${green(
                env
            )} environment). Note that the initial deployment can take up to 15 minutes, so please be patient.`
        );

        await sleep();
    }

    // 3. Start deploying apps one-by-one.

    try {
        await sendEvent({ event: "project-deploy-start" });

        // Deploying `core` project application.
        if (hasCore) {
            isFirstDeployment && console.log();
            context.info(`Deploying ${green("Core")} project application...`);

            await deploy("apps/core", env, inputs);
            context.success(`${green("Core")} project application was deployed successfully!`);
            isFirstDeployment && (await sleep(2000));
        }

        // Deploying `api` project application.
        console.log();
        context.info(`Deploying ${green("API")} project application...`);

        await deploy(apiFolder, env, inputs);
        context.success(`${green("API")} project application was deployed successfully!`);
        isFirstDeployment && (await sleep(2000));

        // Deploying `apps/admin` project application.
        console.log();
        context.info(`Deploying ${green("Admin")} project application...`);
        isFirstDeployment && (await sleep());

        await deploy("apps/admin", env, inputs);
        context.success(`${green("Admin")} project application was deployed successfully!`);

        // Deploying `apps/admin` project application.
        console.log();
        context.info(`Deploying ${green("Website")} project application...`);
        isFirstDeployment && (await sleep());

        await deploy("apps/website", env, inputs);
        context.success(`${green("Website")} project application was deployed successfully!`);

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
        api: getStackOutput({ folder: apiFolder, env }),
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
};

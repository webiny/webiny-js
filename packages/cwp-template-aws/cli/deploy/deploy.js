const {
    getStackOutput,
    getPulumi,
    GracefulPulumiError
} = require("@webiny/cli-plugin-deploy-pulumi/utils");
const { sendEvent } = require("@webiny/cli/utils");
const { bold } = require("chalk");
const deployCommand = require("@webiny/cli-plugin-deploy-pulumi/commands/deploy");
const { printEnvOutput } = require("../info");
const sleep = require("../utils/sleep");
const open = require("open");
const ora = require("ora");

const deployApp = async ({ name, folder, inputs, context, isFirstDeployment }) => {
    context.info(`Deploying %s project application...`, name);
    console.log();

    await deployCommand(
        {
            ...inputs,
            folder: folder,
            env: inputs.env || "dev",
            telemetry: false
        },
        context
    );

    console.log();
    context.success(`%s project application deployed successfully.`, name);
    console.log();

    isFirstDeployment && (await sleep());
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
        const isFirstDeployment = getStackOutput({ folder: "apps/core", env });
        if (isFirstDeployment) {
            context.info(`Looks like this is your first time deploying the project.`);
            context.info(
                `Note that the initial deployment can take up to %s, so please be patient.`,
                "15 minutes"
            );
            await sleep();
        }

        // 3. Start deploying apps one-by-one.
        isFirstDeployment && console.log();

        await deployApp({ name: "Core", folder: "apps/core", inputs, context, isFirstDeployment });
        await deployApp({ name: "API", folder: "apps/api", inputs, context, isFirstDeployment });
        await deployApp({
            name: "Admin",
            folder: "apps/admin",
            inputs,
            context,
            isFirstDeployment
        });
        await deployApp({
            name: "Website",
            folder: "apps/website",
            inputs,
            context,
            isFirstDeployment
        });

        const adminAppOutput = getStackOutput({ folder: "apps/admin", env });

        if (isFirstDeployment) {
            context.success(`Congratulations! You've just deployed a brand new project!`);
            console.log();

            context.info(
                "The final step is to open the %s app in your browser and complete the installation wizard.",
                "Admin"
            );

            const spinner = ora(
                `Opening ${context.info.hl("Admin")} app in your browser...`
            ).start();

            try {
                await sleep(7000);
                await open(adminAppOutput.appUrl);
                spinner.succeed(
                    `Successfully opened ${context.info.hl("Admin")} app in your browser.`
                );
                console.log();

                context.success(
                    `Initial deployed completed successfully. Here are some useful project details.`
                );
                console.log();
            } catch (e) {
                spinner.fail(`Failed to open ${context.error.hl("Admin")} app in your browser.`);

                await sleep(1000);
                console.log();
                context.warning(
                    `Failed to open %s app in your browser. To finish the setup, please visit %s and complete the installation.`,
                    "Admin",
                    adminAppOutput.appUrl
                );
                console.log();
            }
        } else {
            context.success(`Project deployed successfully. Here are some useful project details.`);
            console.log();
        }

        console.log(bold("Project details"));
        await printEnvOutput(env, context);

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

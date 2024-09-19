const {
    getStackOutput,
    getPulumi,
    GracefulPulumiError
} = require("@webiny/cli-plugin-deploy-pulumi/utils");
const { sendEvent } = require("@webiny/cli/utils");
const { bold } = require("chalk");
const deployCommand = require("@webiny/cli-plugin-deploy-pulumi/commands/deploy");
const { getInfo } = require("../info");
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
    context.success(`%s project application deployed.`, name);
    console.log();

    isFirstDeployment && (await sleep());
};

module.exports = async (inputs, context) => {
    await sendEvent("cli-project-deploy-start");

    try {
        const { env = "dev" } = inputs;

        // 1. Check if Pulumi is installed. By calling the `install` method
        // manually, we get to know if the installation was initiated or not.
        const pulumi = await getPulumi({ install: false });
        const installed = await pulumi.install();

        // If we just installed Pulumi, let's add a new line.
        installed && console.log();

        // 2. Check if first deployment.
        const isFirstDeployment = !getStackOutput({ folder: "apps/core", env });
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

        if (isFirstDeployment) {
            context.success(`Congratulations! You've just deployed a brand new project!`);
        } else {
            context.success(`Project deployed.`);
        }

        const projectDetails = await getInfo(env);
        console.log();
        console.log(bold("Project Details"));
        console.log(projectDetails);

        const adminAppOutput = getStackOutput({ folder: "apps/admin", env });

        if (isFirstDeployment) {
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
            } catch {
                spinner.fail(`Failed to open ${context.error.hl("Admin")} app in your browser.`);

                await sleep(1000);
                console.log();
                context.warning(
                    `Failed to open %s app in your browser. To finish the setup and start using the project, please visit %s and complete the installation wizard.`,
                    "Admin",
                    adminAppOutput.appUrl
                );
            }
        }

        await sendEvent("cli-project-deploy-end");
    } catch (e) {
        const gracefulError = e.cause?.gracefulError;
        if (gracefulError instanceof GracefulPulumiError) {
            await sendEvent("cli-project-deploy-error-graceful", {
                // Send original error message and stack.
                errorMessage: e.cause.error?.message || e.message,
                errorStack: e.cause.error?.stack || e.stack
            });
        } else {
            await sendEvent("cli-project-deploy-error", {
                errorMessage: e.message,
                errorStack: e.stack
            });
        }

        throw e;
    }
};

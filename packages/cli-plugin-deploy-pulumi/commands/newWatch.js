const chalk = require("chalk");
const path = require("path");
const { getProjectApplication, getProject } = require("@webiny/cli/utils");
const get = require("lodash/get");
const merge = require("lodash/merge");
const { loadEnvVariables, runHook, getDeploymentId } = require("../utils");
const { getIotEndpoint } = require("./newWatch/getIotEndpoint");
const { listLambdaFunctions } = require("./newWatch/listLambdaFunctions");
const listPackages = require("./newWatch/listPackages");
const { PackagesWatcher } = require("./newWatch/watchers/PackagesWatcher");
const { initEventsHandling } = require("./newWatch/initEventsHandling");
const { replaceLambdaFunctions } = require("./newWatch/replaceLambdaFunctions");

// Do not allow watching "prod" and "production" environments. On the Pulumi CLI side, the command
// is still in preview mode, so it's definitely not wise to use it on production environments.
const WATCH_DISABLED_ENVIRONMENTS = ["prod", "production"];

module.exports = async (inputs, context) => {
    // 1. Initial checks for deploy and build commands.
    if (!inputs.folder && !inputs.package) {
        throw new Error(
            `Either "folder" or "package" arguments must be passed. Cannot have both undefined.`
        );
    }

    const project = getProject();

    const projectApplicationSpecified = !!inputs.folder;

    // Detect if an app alias was provided.
    let projectApplication;
    if (projectApplicationSpecified) {
        if (project.config.appAliases) {
            const appAliases = project.config.appAliases;
            if (appAliases[inputs.folder]) {
                inputs.folder = appAliases[inputs.folder];
            }
        }

        // Get project application metadata. Will throw an error if invalid folder specified.
        projectApplication = getProjectApplication({
            cwd: path.join(process.cwd(), inputs.folder)
        });

        // If exists - read default inputs from "webiny.application.ts" file.
        inputs = merge({}, get(projectApplication, "config.cli.watch"), inputs);

        // We don't do anything here. We assume the workspace has already been created
        // upon running the `webiny deploy` command. We rely on that.
        // TODO: maybe we can improve this in the future, depending on the feedback.
        // await createProjectApplicationWorkspace({
        //     projectApplication,
        //     env: inputs.env,
        //     context,
        //     inputs
        // });

        // Check if there are any plugins that need to be registered.
        if (projectApplication.config.plugins) {
            context.plugins.register(projectApplication.config.plugins);
        }

        // Load env vars specified via .env files located in project application folder.
        await loadEnvVariables(inputs, context);
    }

    if (projectApplicationSpecified && !inputs.env) {
        throw new Error(`Please specify environment, for example "dev".`);
    }

    if (WATCH_DISABLED_ENVIRONMENTS.includes(inputs.env)) {
        if (!inputs.allowProduction) {
            throw new Error(
                `${chalk.red("webiny watch")} command cannot be used with production environments.`
            );
        }
    }

    const hookArgs = { context, env: inputs.env, inputs, projectApplication };

    await runHook({
        hook: "hook-before-watch",
        args: hookArgs,
        context
    });

    console.log();

    const packages = await listPackages({ inputs });
    const packagesWatcher = new PackagesWatcher({ packages, context, inputs });

    if (!projectApplicationSpecified) {
        await packagesWatcher.watch();
        return;
    }

    // Maximum of 15minutes in seconds can be passed.
    if (inputs.increaseTimeout > 900) {
        throw new Error(
            `When increasing the timeout, the maximum value that can be passed is 900 seconds (15 minutes).`
        );
    }

    let lambdaFunctions = listLambdaFunctions(inputs);

    // Let's filter out the authorizer function, as it's not needed for the watch command.
    if (projectApplication.id === "core") {
        lambdaFunctions = lambdaFunctions.filter(fn => {
            const isAuthorizerFunction = fn.name.includes("watch-command-iot-authorizer");
            return !isAuthorizerFunction;
        });
    }

    if (!lambdaFunctions.length) {
        context.debug("No AWS Lambda functions will be invoked locally.");
        await packagesWatcher.watch();
        return;
    }

    const deployCommand = `yarn webiny deploy ${projectApplication.id} --env ${inputs.env}`;
    const learnMoreLink = "https://webiny.link/local-aws-lambda-development";

    context.info(`Local AWS Lambda development session started.`);
    context.info(
        `Note that you should deploy your changes once you're done. To do so, run: %s. Learn more: %s.`,
        deployCommand,
        learnMoreLink
    );

    context.debug(
        "The events for following AWS Lambda functions will be forwarded locally: ",
        lambdaFunctions.map(fn => fn.name)
    );

    console.log();

    // eslint-disable-next-line
    const { default: exitHook } = await import("exit-hook");

    exitHook(() => {
        console.log();
        console.log();

        context.info(`Stopping local AWS Lambda development session.`);
        context.info(
            `Note that you should deploy your changes. To do so, run: %s. Learn more: %s.`,
            deployCommand,
            learnMoreLink
        );
    });

    const deploymentId = getDeploymentId({ env: inputs.env });
    const iotEndpointTopic = `webiny-watch-${deploymentId}`;
    const iotEndpoint = await getIotEndpoint({ env: inputs.env });
    const sessionId = new Date().getTime();
    const increaseTimeout = inputs.increaseTimeout;

    // Ignore promise, we don't need to wait for this to finish.
    replaceLambdaFunctions({
        iotEndpoint,
        iotEndpointTopic,
        sessionId,
        lambdaFunctions,
        increaseTimeout
    });

    let inspector;
    if (inputs.inspect) {
        inspector = require("inspector");
        inspector.open(9229, "127.0.0.1");
        console.log();

        exitHook(() => {
            inspector.close();
        });
    }

    // Ignore promise, we don't need to wait for this to finish.
    initEventsHandling({
        iotEndpoint,
        iotEndpointTopic,
        lambdaFunctions,
        sessionId,
        inspector
    });

    await packagesWatcher.watch();
};

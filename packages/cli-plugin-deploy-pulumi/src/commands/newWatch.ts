import { Context, IUserCommandInput, ProjectApplication } from "~/types";
import chalk from "chalk";
import path from "path";
import { getProject, getProjectApplication } from "@webiny/cli/utils";
import get from "lodash/get";
import merge from "lodash/merge";
import type inspectorType from "inspector";
import { getDeploymentId, loadEnvVariables, runHook, setMustRefreshBeforeDeploy } from "~/utils";
import { getIotEndpoint } from "./newWatch/getIotEndpoint";
import { listLambdaFunctions } from "./newWatch/listLambdaFunctions";
import { listPackages } from "./newWatch/listPackages";
import { PackagesWatcher } from "./newWatch/watchers/PackagesWatcher";
import { initInvocationForwarding } from "./newWatch/initInvocationForwarding";
import { replaceLambdaFunctions } from "./newWatch/replaceLambdaFunctions";

// Do not allow watching "prod" and "production" environments. On the Pulumi CLI side, the command
// is still in preview mode, so it's definitely not wise to use it on production environments.
const WATCH_DISABLED_ENVIRONMENTS = ["prod", "production"];

export const newWatch = async (inputs: IUserCommandInput, context: Context) => {
    // 1. Initial checks for deploy and build commands.
    if (!inputs.folder && !inputs.package) {
        throw new Error(
            `Either "folder" or "package" arguments must be passed. Cannot have both undefined.`
        );
    }

    const project = getProject();

    const projectApplicationSpecified = !!inputs.folder;

    // Detect if an app alias was provided.
    let projectApplication: ProjectApplication | undefined = undefined;
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

        /**
         * We can safely assume that the project application is defined here.
         *
         * Check if there are any plugins that need to be registered.
         */
        if (projectApplication!.config.plugins) {
            context.plugins.register(projectApplication!.config.plugins);
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

    const hookArgs = {
        context,
        env: inputs.env,
        variant: inputs.variant,
        inputs,
        projectApplication
    };

    await runHook({
        hook: "hook-before-watch",
        args: hookArgs,
        context
    });

    console.log();

    const packages = await listPackages({ inputs });
    const packagesWatcher = new PackagesWatcher({ packages, context, inputs });

    if (!projectApplicationSpecified || !projectApplication) {
        await packagesWatcher.watch();
        return;
    }

    // Maximum of 15minutes in seconds can be passed.
    if (inputs.increaseTimeout && inputs.increaseTimeout > 900) {
        throw new Error(
            `When increasing the timeout, the maximum value that can be passed is 900 seconds (15 minutes).`
        );
    }

    const functionsList = listLambdaFunctions({
        env: inputs.env,
        folder: inputs.folder,
        variant: inputs.variant,
        whitelist: inputs.function
    });

    const deployCommand = `yarn webiny deploy ${projectApplication.id} --env ${inputs.env}`;
    const learnMoreLink = "https://webiny.link/local-aws-lambda-development";
    const troubleshootingLink = learnMoreLink + "#troubleshooting";

    if (functionsList.meta.count === 0) {
        // If functions exist, but none are selected for watching, show a warning.
        if (functionsList.meta.totalCount > 0) {
            context.info(
                [
                    "No AWS Lambda functions will be invoked locally. If this is unexpected, you can try the following:",
                    " ‣ stop the current development session",
                    " ‣ redeploy the %s application by running %s command",
                    " ‣ start a new %s session by rerunning %s command",
                    "",
                    "Learn more: %s"
                ].join("\n"),
                projectApplication.name,
                deployCommand,
                "webiny watch",
                "webiny watch",
                troubleshootingLink
            );
            console.log();
        }

        await packagesWatcher.watch();
        return;
    }

    context.info(`Local AWS Lambda development session started.`);
    context.warning(
        `Note that once the session is terminated, the %s application will no longer work. To fix this, you %s redeploy it via the %s command. Learn more: %s.`,
        projectApplication.name,
        "MUST",
        deployCommand,
        learnMoreLink
    );

    context.debug(
        "The events for following AWS Lambda functions will be forwarded locally: ",
        functionsList.list.map(fn => fn.name)
    );

    console.log();
    const { default: exitHook } = await import(/* webpackChunkName: "exit-hook" */ "exit-hook");

    exitHook(() => {
        console.log();
        console.log();

        context.info(`Terminating local AWS Lambda development session.`);
        context.warning(
            `Note that once the session is terminated, the %s application will no longer work. To fix this, you %s redeploy it via the %s command. Learn more: %s.`,
            projectApplication?.name,
            "MUST",
            deployCommand,
            learnMoreLink
        );
    });

    const deploymentId = getDeploymentId({
        env: inputs.env,
        variant: inputs.variant
    });
    const iotEndpointTopic = `webiny-watch-${deploymentId}`;
    const iotEndpoint = await getIotEndpoint({
        env: inputs.env,
        variant: inputs.variant
    });
    const sessionId = new Date().getTime();
    const increaseTimeout = inputs.increaseTimeout;
    const localExecutionHandshakeTimeout = inputs.increaseHandshakeTimeout || 5; // Default to 5 seconds.

    // We want to ensure a Pulumi refresh is made before the next deploy.
    setMustRefreshBeforeDeploy(context);

    // Ignore promise, we don't need to wait for this to finish.
    replaceLambdaFunctions({
        context,
        env: inputs.env,
        folder: inputs.folder,
        variant: inputs.variant,

        iotEndpoint,
        iotEndpointTopic,
        sessionId,
        functionsList,
        increaseTimeout,
        localExecutionHandshakeTimeout
    });

    let inspector: typeof inspectorType | undefined = undefined;
    if (inputs.inspect) {
        inspector = require("inspector");
        inspector!.open(9229, "127.0.0.1");
        console.log();

        exitHook(() => {
            inspector!.close();
        });
    }

    // Ignore promise, we don't need to wait for this to finish.
    initInvocationForwarding({
        iotEndpoint,
        iotEndpointTopic,
        functionsList,
        sessionId
    });

    await packagesWatcher.watch();
};

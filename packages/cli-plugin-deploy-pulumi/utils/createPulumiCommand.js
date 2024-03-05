const path = require("path");
const { getProjectApplication, getProject, sendEvent } = require("@webiny/cli/utils");
const createProjectApplicationWorkspace = require("./createProjectApplicationWorkspace");
const login = require("./login");
const loadEnvVariables = require("./loadEnvVariables");
const getPulumi = require("./getPulumi");
const { GracefulPulumiError } = require("./GracefulPulumiError");

const createPulumiCommand = ({
    name,
    command,
    createProjectApplicationWorkspace: createProjectApplicationWorkspaceParam,
    telemetry
}) => {
    return async (params, context) => {
        // If folder not specified, that means we want to deploy the whole project (all project applications).
        // For that, we look if there are registered plugins that perform that.
        if (!params.folder) {
            const plugin = context.plugins.byName(`cli-command-deployment-${name}-all`);
            if (!plugin) {
                throw new GracefulPulumiError(
                    `Cannot continue - "cli-command-deployment-${name}-all" plugin not found.`
                );
            }

            return plugin[name](params, context);
        }

        // Before proceeding, let's detect if multiple project applications were passed.
        const folders = params.folder.split(",").map(current => current.trim());
        if (folders.length > 1) {
            for (let i = 0; i < folders.length; i++) {
                const folder = folders[i];
                await createPulumiCommand({ name, command, createProjectApplicationWorkspace })(
                    {
                        ...params,
                        folder
                    },
                    context
                );
            }

            return;
        }

        // Detect if an app alias was provided.
        const project = getProject();
        if (project.config.appAliases) {
            const appAliases = project.config.appAliases;
            if (appAliases[params.folder]) {
                params.folder = appAliases[params.folder];
            }
        }

        const sendTelemetryEvents = telemetry === true && params.telemetry !== false;
        const getTelemetryEventName = stage => `pulumi-command-${name}-${stage}`;
        const telemetryProperties = {
            env: params.env || "unknown",
            commandParams: JSON.stringify(params)
        };

        try {
            if (sendTelemetryEvents) {
                const eventName = getTelemetryEventName("start");
                await sendEvent(eventName, telemetryProperties);
            }

            if (!params.env) {
                throw new GracefulPulumiError(`Please specify environment, for example "dev".`);
            }

            const start = new Date();
            const getDuration = () => {
                return (new Date() - start) / 1000 + "s";
            };

            const cwd = path.join(process.cwd(), params.folder);

            // Get project application metadata.
            const projectApplication = getProjectApplication({ cwd });

            if (createProjectApplicationWorkspaceParam !== false) {
                await createProjectApplicationWorkspace({
                    projectApplication,
                    context,
                    inputs: params,
                    env: params.env
                });
            }

            // Check if there are any plugins that need to be registered. This needs to happen
            // always, no matter the value of `createProjectApplicationWorkspaceParam` parameter.
            if (projectApplication.config.plugins) {
                context.plugins.register(projectApplication.config.plugins);
            }

            // Load env vars specified via .env files located in project application folder.
            await loadEnvVariables(params, context);

            await login(projectApplication);

            const pulumi = await getPulumi({ projectApplication });

            const result = await command({
                inputs: params,
                context,
                projectApplication,
                pulumi,
                getDuration
            });

            if (sendTelemetryEvents) {
                const eventName = getTelemetryEventName("end");
                await sendEvent(eventName, telemetryProperties);
            }

            return result;
        } catch (e) {
            const gracefulError = GracefulPulumiError.from(e);
            if (gracefulError) {
                if (sendTelemetryEvents) {
                    const eventName = getTelemetryEventName("error-graceful");
                    await sendEvent(eventName, {
                        ...telemetryProperties,
                        errorMessage: e.message,
                        errorStack: e.stack
                    });
                }
                throw gracefulError;
            }

            if (sendTelemetryEvents) {
                const eventName = getTelemetryEventName("error");
                await sendEvent(eventName, {
                    ...telemetryProperties,
                    errorMessage: e.message,
                    errorStack: e.stack
                });
            }

            const debugFlag = context.error.hl(`--debug`);
            throw new Error(
                [
                    `Command failed with an unexpected error. Please check the above logs. Alternatively,`,
                    `try running the same command with the ${debugFlag} flag to get more detailed information.`
                ].join(" "),
                { cause: e }
            );
        }
    };
};

module.exports = createPulumiCommand;

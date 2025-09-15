// @ts-nocheck @adrian
import { getStackOutput } from "@webiny/project";

const NO_DEPLOYMENT_CHECKS_FLAG_NAME = "--no-deployment-checks";

type CreatePluginCallable = (command: "build" | "watch", appName: "admin" | "website") => Callable;

const createPluginCallable: CreatePluginCallable = (command, appName) => {
    return async (params, ctx) => {
        const { env, inputs, variant } = params;
        // Just in case, we want to allow users to skip the system requirements check.
        if (inputs.deploymentChecks === false) {
            return;
        }

        const output = await getStackOutput({ app: "api", env, variant });
        const apiDeployed = output && Object.keys(output).length > 0;
        if (apiDeployed) {
            return;
        }

        const apiAppName = ctx.error.hl("API");
        const adminAppName = ctx.error.hl(appName);
        const cmd = ctx.error.hl(`yarn webiny deploy api --env ${env}`);
        ctx.error(
            `Cannot ${command} ${adminAppName} project application before deploying ${apiAppName}.`
        );

        const message = [
            `Before ${command}ing ${adminAppName} project application, please`,
            `deploy ${apiAppName} first by running: ${cmd}.`,
            `If you think this is a mistake, you can also try skipping`,
            `the deployment checks by appending the ${ctx.error.hl(
                NO_DEPLOYMENT_CHECKS_FLAG_NAME
            )} flag.`,
            `Learn more: https://webiny.link/deploy-api-first`
        ];

        throw new GracefulError(message.join(" "));
    };
};

export const createEnsureApiDeployedPlugins = (appName: "admin" | "website") => {
    const ensureApiDeployedBeforeBuild = createBeforeBuildPlugin(
        createPluginCallable("build", appName)
    );
    ensureApiDeployedBeforeBuild.name = `${appName}.before-deploy.ensure-api-deployed`;

    const ensureApiDeployedBeforeWatch = createBeforeWatchPlugin(
        createPluginCallable("watch", appName)
    );
    ensureApiDeployedBeforeWatch.name = `${appName}.before-watch.ensure-api-deployed`;

    return [ensureApiDeployedBeforeBuild, ensureApiDeployedBeforeWatch];
};

import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import {
    createBeforeBuildPlugin,
    createBeforeWatchPlugin
} from "@webiny/cli-plugin-deploy-pulumi/plugins";
import { GracefulError } from "@webiny/cli-plugin-deploy-pulumi/utils";
import type { Callable } from "@webiny/cli-plugin-deploy-pulumi/plugins/PulumiCommandLifecycleEventHookPlugin";

const createPluginCallable: (command: "build" | "watch") => Callable =
    command =>
    ({ env }, ctx) => {
        const output = getStackOutput({ folder: "apps/api", env });
        const apiDeployed = output && Object.keys(output).length > 0;
        if (apiDeployed) {
            return;
        }

        const apiAppName = ctx.error.hl("API");
        const websiteAppName = ctx.error.hl("Website");
        const cmd = ctx.error.hl(`yarn webiny deploy api --env ${env}`);
        ctx.error(
            `Cannot ${command} ${websiteAppName} project application before deploying ${apiAppName}.`
        );

        throw new GracefulError(
            [
                `Before ${command}ing ${websiteAppName} project application, please`,
                `deploy ${apiAppName} first by running: ${cmd}.`
            ].join(" ")
        );
    };

export const ensureApiDeployedBeforeBuild = createBeforeBuildPlugin(createPluginCallable("build"));
ensureApiDeployedBeforeBuild.name = "website.before-deploy.ensure-api-deployed";

export const ensureApiDeployedBeforeWatch = createBeforeWatchPlugin(createPluginCallable("watch"));
ensureApiDeployedBeforeWatch.name = "website.before-watch.ensure-api-deployed";

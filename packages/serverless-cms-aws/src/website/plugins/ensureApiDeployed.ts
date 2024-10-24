import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import { createBeforeBuildPlugin } from "@webiny/cli-plugin-deploy-pulumi/plugins";
import { GracefulError } from "@webiny/cli-plugin-deploy-pulumi/utils";

export const ensureApiDeployedBeforeBuild = createBeforeBuildPlugin(({ env }, ctx) => {
    const output = getStackOutput({ folder: "apps/api", env });
    const apiDeployed = output && Object.keys(output).length > 0;
    if (apiDeployed) {
        return;
    }

    const apiAppName = ctx.error.hl("API");
    const websiteAppName = ctx.error.hl("Website");
    const cmd = ctx.error.hl(`yarn webiny deploy api --env ${env}`);
    ctx.error(`Cannot build ${websiteAppName} project application before deploying ${apiAppName}.`);

    throw new GracefulError(
        [
            `Before building ${websiteAppName} project application, please`,
            `deploy ${apiAppName} first by running: ${cmd}.`
        ].join(" ")
    );
});

ensureApiDeployedBeforeBuild.name = "website.before-build.ensure-api-deployed";

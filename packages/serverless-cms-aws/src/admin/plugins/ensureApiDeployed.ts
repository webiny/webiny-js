import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import { BeforeDeployPlugin } from "@webiny/cli-plugin-deploy-pulumi/plugins";
import { GracefulError } from "@webiny/cli-plugin-deploy-pulumi/utils";

export const ensureApiDeployed = new BeforeDeployPlugin(({ env }, ctx) => {
    const output = getStackOutput({ folder: "apps/api", env });
    const apiDeployed = output && Object.keys(output).length > 0;
    if (apiDeployed) {
        return;
    }

    const apiAppName = ctx.error.hl("API");
    const adminAppName = ctx.error.hl("Admin");
    const cmd = ctx.error.hl(`yarn webiny deploy api --env ${env}`);

    throw new GracefulError(
        [
            `Cannot deploy ${adminAppName} project application before deploying ${apiAppName}.`,
            `Please deploy ${apiAppName} project application first by running: ${cmd}.`
        ].join(" ")
    );
});

ensureApiDeployed.name = "api.before-deploy.ensure-api-deployed";

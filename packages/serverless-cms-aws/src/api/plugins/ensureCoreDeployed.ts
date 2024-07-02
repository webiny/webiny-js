import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import { BeforeDeployPlugin } from "@webiny/cli-plugin-deploy-pulumi/plugins";
import { GracefulError } from "@webiny/cli-plugin-deploy-pulumi/utils";

export const ensureCoreDeployed = new BeforeDeployPlugin(({ env }, ctx) => {
    const output = getStackOutput({ folder: "apps/core", env });
    const coreDeployed = output && Object.keys(output).length > 0;
    if (coreDeployed) {
        return;
    }

    const coreAppName = ctx.error.hl("Core");
    const apiAppName = ctx.error.hl("API");
    const cmd = ctx.error.hl(`yarn webiny deploy core --env ${env}`);
    ctx.error(`Cannot deploy ${apiAppName} project application before deploying ${coreAppName}.`);

    throw new GracefulError(
        [
            `Before deploying ${apiAppName} project application, please`,
            `deploy ${coreAppName} first by running: ${cmd}.`
        ].join(" ")
    );
});

ensureCoreDeployed.name = "api.before-deploy.ensure-core-deployed";

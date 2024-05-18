import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import { BeforeBuildPlugin } from "@webiny/cli-plugin-deploy-pulumi/plugins";
import { GracefulError } from "@webiny/cli-plugin-deploy-pulumi/utils";

export const ensureApiDeployed = new BeforeBuildPlugin(({ env }, ctx) => {
    const output = getStackOutput({ folder: "apps/api", env });
    const apiDeployed = output && Object.keys(output).length > 0;
    if (apiDeployed) {
        return;
    }

    const apiAppName = ctx.error.hl("API");
    const adminAppName = ctx.error.hl("Admin");
    const cmd = ctx.error.hl(`yarn webiny deploy api --env ${env}`);
    ctx.error(`Cannot build ${adminAppName} project application before deploying ${apiAppName}.`);

    throw new GracefulError(
        [
            `Before building ${adminAppName} project application, please`,
            `deploy ${apiAppName} first by running: ${cmd}.`
        ].join(" ")
    );
});

ensureApiDeployed.name = "api.before-deploy.ensure-api-deployed";

import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";
import { BeforeDeployPlugin } from "@webiny/cli-plugin-deploy-pulumi/plugins";
import { GracefulError } from "@webiny/cli-plugin-deploy-pulumi/utils";

export const ensureCoreDeployed = new BeforeDeployPlugin(({ env }, ctx) => {

});

ensureCoreDeployed.name = "api.before-deploy.ensure-core-deployed";

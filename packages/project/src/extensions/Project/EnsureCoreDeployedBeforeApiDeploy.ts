import { createImplementation } from "@webiny/di";
import { ApiBeforeDeploy, GetAppStackOutput } from "~/abstractions/index.js";
import { GracefulError } from "@webiny/project";

class EnsureCoreDeployedBeforeApiDeploy implements ApiBeforeDeploy.Interface {
    constructor(private getAppStackOutput: GetAppStackOutput.Interface) {}

    async execute(params: ApiBeforeDeploy.Params) {
        const output = await this.getAppStackOutput.execute({ ...params, app: "core" });

        const coreDeployed = output && Object.keys(output).length > 0;
        if (coreDeployed) {
            return;
        }

        const { variant, env } = params;

        let variantCmd = "";
        if (variant) {
            variantCmd = ` --variant ${variant}`;
        }

        const error = new Error(`Cannot deploy API before deploying Core.`);

        const message = [`Before deploying %s, please`, `deploy %s first by running: %s.`].join(
            " "
        );

        const cmd = `yarn webiny deploy core --env ${env}${variantCmd}`;
        throw GracefulError.from(error, message, "API", "Core", cmd);
    }
}

export default createImplementation({
    abstraction: ApiBeforeDeploy,
    implementation: EnsureCoreDeployedBeforeApiDeploy,
    dependencies: [GetAppStackOutput]
});

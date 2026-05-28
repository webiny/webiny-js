import {
    ApiBeforeDeploy,
    GetAppStackOutput,
    ProjectSdkParamsService
} from "~/abstractions/index.js";
import { GracefulError } from "~/index.js";

class EnsureCoreDeployedBeforeApiDeployImpl implements ApiBeforeDeploy.Interface {
    constructor(
        private getAppStackOutput: GetAppStackOutput.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface
    ) {}

    async execute() {
        const output = await this.getAppStackOutput.execute("core");

        const coreDeployed = output && Object.keys(output).length > 0;
        if (coreDeployed) {
            return;
        }

        const sdkParams = this.projectSdkParamsService.get();
        const { variant, env } = sdkParams;

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

export const EnsureCoreDeployedBeforeApiDeploy = ApiBeforeDeploy.createImplementation({
    implementation: EnsureCoreDeployedBeforeApiDeployImpl,
    dependencies: [GetAppStackOutput, ProjectSdkParamsService]
});

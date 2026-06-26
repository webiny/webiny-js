import {
    CoreBeforeDeploy,
    GetProductionEnvironments,
    IsRemotePulumiBackendService,
    ProjectSdkParamsService
} from "~/abstractions/index.js";
import { GracefulError } from "~/index.js";

class ValidateProductionPulumiStateImpl implements CoreBeforeDeploy.Interface {
    constructor(
        private isRemotePulumiBackendService: IsRemotePulumiBackendService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface,
        private getProductionEnvironments: GetProductionEnvironments.Interface
    ) {}

    async execute(params: CoreBeforeDeploy.Params) {
        const sdkParams = this.projectSdkParamsService.get();
        const { env } = sdkParams;
        const { allowLocalStateFiles } = params;

        const prodEnvs = await this.getProductionEnvironments.execute();
        const isProdEnv = prodEnvs.includes(env);

        if (!isProdEnv) {
            return;
        }

        if (this.isRemotePulumiBackendService.execute()) {
            return;
        }

        if (allowLocalStateFiles) {
            return;
        }

        const error = new Error("Cannot deploy to production with local state files.");

        const message = [
            "Use the %s flag to continue with local Pulumi state files,",
            "or configure a remote backend for production deployments.",
            "Learn more: https://webiny.link/state-files-production."
        ].join(" ");

        throw GracefulError.from(error, message, "--allow-local-state-files");
    }
}

export const ValidateProductionPulumiState = CoreBeforeDeploy.createImplementation({
    implementation: ValidateProductionPulumiStateImpl,
    dependencies: [IsRemotePulumiBackendService, ProjectSdkParamsService, GetProductionEnvironments]
});

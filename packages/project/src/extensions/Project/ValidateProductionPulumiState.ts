import {
    CoreBeforeDeploy,
    IsRemotePulumiBackendService,
    ProjectSdkParamsService
} from "~/abstractions/index.js";
import { GracefulError } from "@webiny/project";
import chalk from "chalk";

class ValidateProductionPulumiStateImpl implements CoreBeforeDeploy.Interface {
    constructor(
        private isRemotePulumiBackendService: IsRemotePulumiBackendService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface
    ) {}

    async execute(params: CoreBeforeDeploy.Params) {
        const sdkParams = this.projectSdkParamsService.get();
        const { env, allowLocalStateFiles } = sdkParams;

        const prodEnvs = ["prod", "production"];
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

        const error = new Error(
            "Please confirm you want to use local Pulumi state files with your production deployment."
        );

        const message = [
            "Please confirm you want to use local Pulumi state files with",
            "your production deployment by appending",
            "%s to the command.",
            "Learn more: https://webiny.link/state-files-production."
        ].join(" ");

        throw GracefulError.from(error, message, chalk.red("--allow-local-state-files"));
    }
}

export const ValidateProductionPulumiState = CoreBeforeDeploy.createImplementation({
    implementation: ValidateProductionPulumiStateImpl,
    dependencies: [IsRemotePulumiBackendService, ProjectSdkParamsService]
});

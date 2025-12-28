import {
    ApiBeforeWatch,
    GetAppStackOutput,
    ProjectSdkParamsService
} from "~/abstractions/index.js";
import { GracefulError } from "@webiny/project";

const NO_DEPLOYMENT_CHECKS_FLAG_NAME = "--no-deployment-checks";

class EnsureApiDeployedBeforeWatchImpl implements ApiBeforeWatch.Interface {
    constructor(
        private getAppStackOutput: GetAppStackOutput.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface
    ) {}

    async execute(params: ApiBeforeWatch.Params) {
        // Just in case, we want to allow users to skip the system requirements check.
        if (params.deploymentChecks === false) {
            return;
        }

        const output = await this.getAppStackOutput.execute({ ...params, app: "api" });
        const apiDeployed = output && Object.keys(output).length > 0;
        if (apiDeployed) {
            return;
        }

        const error = new Error(`Cannot watch API before deploying it.`);
        const sdkParams = this.projectSdkParamsService.get();
        const cmd = `yarn webiny deploy api --env ${sdkParams.env}`;

        const message = [
            `Before watching %s, please deploy it first by running: %s.`,
            `If you think this is a mistake, you can also try skipping`,
            `deployment checks by appending the %s flag.`,
            `Learn more: https://webiny.link/deployment-checks`
        ].join(" ");

        throw GracefulError.from(error, message, "API", cmd, NO_DEPLOYMENT_CHECKS_FLAG_NAME);
    }
}

export const EnsureApiDeployedBeforeWatch = ApiBeforeWatch.createImplementation({
    implementation: EnsureApiDeployedBeforeWatchImpl,
    dependencies: [GetAppStackOutput, ProjectSdkParamsService]
});

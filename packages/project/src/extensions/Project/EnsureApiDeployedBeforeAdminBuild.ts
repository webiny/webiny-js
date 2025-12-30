import {
    AdminBeforeBuild,
    GetAppStackOutput,
    ProjectSdkParamsService
} from "~/abstractions/index.js";
import { GracefulError } from "@webiny/project";

const NO_DEPLOYMENT_CHECKS_FLAG_NAME = "--no-deployment-checks";

class EnsureApiDeployedBeforeAdminBuildImpl implements AdminBeforeBuild.Interface {
    constructor(
        private getAppStackOutput: GetAppStackOutput.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface
    ) {}

    async execute(params: AdminBeforeBuild.Params) {
        // Just in case, we want to allow users to skip the system requirements check.
        if (params.deploymentChecks === false) {
            return;
        }

        const output = await this.getAppStackOutput.execute("api");
        const apiDeployed = output && Object.keys(output).length > 0;
        if (apiDeployed) {
            return;
        }

        const sdkParams = this.projectSdkParamsService.get();
        const cmd = `yarn webiny deploy api --env ${sdkParams.env}`;

        const error = new Error("Cannot build Admin before deploying API.");
        const message = [
            `Before building %s, please build %s first by running: %s.`,
            `If you think this is a mistake, you can also try skipping`,
            `deployment checks by appending the %s flag.`,
            `Learn more: https://webiny.link/deployment-checks`
        ].join(" ");

        throw GracefulError.from(
            error,
            message,
            "Admin",
            "API",
            cmd,
            NO_DEPLOYMENT_CHECKS_FLAG_NAME
        );
    }
}

export const EnsureApiDeployedBeforeAdminBuild = AdminBeforeBuild.createImplementation({
    implementation: EnsureApiDeployedBeforeAdminBuildImpl,
    dependencies: [GetAppStackOutput, ProjectSdkParamsService]
});

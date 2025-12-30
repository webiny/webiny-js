import { Pulumi } from "@webiny/pulumi-sdk";
import { createImplementation } from "@webiny/di";
import {
    GetProjectService,
    GetPulumiService,
    ProjectSdkParamsService
} from "~/abstractions/index.js";
import { serializeProjectSdkContext, WBY_PROJECT_SDK_CONTEXT } from "~/utils/index.js";

export class DefaultGetPulumiService implements GetPulumiService.Interface {
    constructor(
        private readonly getProjectService: GetProjectService.Interface,
        private readonly projectSdkParamsService: ProjectSdkParamsService.Interface
    ) {}

    async execute(params: GetPulumiService.Params = {}) {
        const project = this.getProjectService.execute();
        const { app, pulumiOptions = {} } = params;

        let cwd;
        if (app) {
            cwd = app.paths.workspaceFolder.toString();
        }

        // Get the current SDK params to pass to child processes
        const sdkParams = this.projectSdkParamsService.get();
        const contextEnv = {
            [WBY_PROJECT_SDK_CONTEXT]: serializeProjectSdkContext(sdkParams)
        };

        // Merge the context env with any existing env vars from pulumiOptions
        const mergedExeca = {
            ...pulumiOptions.execa,
            cwd,
            env: {
                ...pulumiOptions.execa?.env,
                ...contextEnv
            }
        };

        return Pulumi.create({
            ...pulumiOptions,
            execa: mergedExeca,
            pulumiFolder: project.paths.dotWebinyFolder.toString()
        });
    }
}

export const getPulumiService = createImplementation({
    abstraction: GetPulumiService,
    implementation: DefaultGetPulumiService,
    dependencies: [GetProjectService, ProjectSdkParamsService]
});

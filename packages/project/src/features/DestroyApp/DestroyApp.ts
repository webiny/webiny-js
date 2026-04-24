import { createImplementation } from "@webiny/di";
import {
    DestroyApp,
    BuildAppWorkspaceService,
    GetApp,
    GetProject,
    GetPulumiService,
    ProjectSdkParamsService,
    PulumiSelectStackService
} from "~/abstractions/index.js";
import {
    createEnvConfiguration,
    withEnv,
    withEnvVariant,
    withProjectName,
    withPulumiConfigPassphrase,
    withRegion
} from "~/utils/env/index.js";

export class DefaultDestroyApp implements DestroyApp.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private buildAppWorkspaceService: BuildAppWorkspaceService.Interface,
        private getProject: GetProject.Interface,
        private pulumiSelectStackService: PulumiSelectStackService.Interface,
        private getPulumiService: GetPulumiService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface
    ) {}

    async execute(params: DestroyApp.Params) {
        await this.buildAppWorkspaceService.execute(params.app);

        const app = this.getApp.execute(params.app);

        await this.pulumiSelectStackService.execute(app);

        const pulumi = await this.getPulumiService.execute({ app });
        const project = await this.getProject.execute();
        const sdkParams = this.projectSdkParamsService.get();

        const env = createEnvConfiguration({
            configurations: [
                withRegion({ region: sdkParams.region }),
                withEnv({ env: sdkParams.env }),
                withEnvVariant({ variant: sdkParams.variant }),
                withPulumiConfigPassphrase(),
                withProjectName({ project })
            ]
        });

        return {
            pulumiProcess: pulumi.run({
                command: "destroy",
                args: {
                    yes: true
                },
                execa: { env }
            })
        };
    }
}

export const destroyApp = createImplementation({
    abstraction: DestroyApp,
    implementation: DefaultDestroyApp,
    dependencies: [
        GetApp,
        BuildAppWorkspaceService,
        GetProject,
        PulumiSelectStackService,
        GetPulumiService,
        ProjectSdkParamsService
    ]
});

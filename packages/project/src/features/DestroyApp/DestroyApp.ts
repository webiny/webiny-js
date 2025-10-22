import { createImplementation } from "@webiny/di-container";
import {
    DestroyApp,
    BuildAppWorkspaceService,
    GetApp,
    GetProject,
    GetPulumiService,
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
        private getPulumiService: GetPulumiService.Interface
    ) {}

    async execute(params: DestroyApp.Params) {
        await this.buildAppWorkspaceService.execute(params);

        const app = this.getApp.execute(params.app);

        await this.pulumiSelectStackService.execute(app, params);

        const pulumi = await this.getPulumiService.execute({ app });
        const project = await this.getProject.execute();

        const env = createEnvConfiguration({
            configurations: [
                withRegion(params),
                withEnv(params),
                withEnvVariant(params),
                withPulumiConfigPassphrase(),
                withProjectName({ project })
            ]
        });

        return {
            pulumiProcess: pulumi.run({
                command: "destroy",
                args: {
                    debug: params.debug || false,
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
        GetPulumiService
    ]
});

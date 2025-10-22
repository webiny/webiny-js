import { createImplementation } from "@webiny/di-container";
import {
    BuildAppWorkspaceService,
    GetApp,
    GetAppOutput,
    GetPulumiService,
    PulumiSelectStackService
} from "~/abstractions/index.js";
import { createEnvConfiguration, withPulumiConfigPassphrase } from "~/utils/env/index.js";

export class DefaultGetAppOutput implements GetAppOutput.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private buildAppWorkspaceService: BuildAppWorkspaceService.Interface,
        private pulumiSelectStackService: PulumiSelectStackService.Interface,
        private getPulumiService: GetPulumiService.Interface
    ) {}

    async execute(params: GetAppOutput.Params) {
        await this.buildAppWorkspaceService.execute(params);

        const app = this.getApp.execute(params.app);

        await this.pulumiSelectStackService.execute(app, params);

        const pulumi = await this.getPulumiService.execute({ app });

        const env = createEnvConfiguration({
            configurations: [withPulumiConfigPassphrase()]
        });

        return {
            pulumiProcess: pulumi.run({
                command: ["stack", "output"],
                args: {
                    json: params.json || false
                },
                execa: { env }
            })
        };
    }
}

export const getAppOutput = createImplementation({
    abstraction: GetAppOutput,
    implementation: DefaultGetAppOutput,
    dependencies: [GetApp, BuildAppWorkspaceService, PulumiSelectStackService, GetPulumiService]
});

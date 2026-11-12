import { createImplementation } from "@webiny/di";
import { BuildAppWorkspaceService } from "@webiny/project/abstractions/index.js";
import { GetApp } from "@webiny/project/abstractions/index.js";
import { GetAppOutput } from "~/abstractions/features/GetAppOutput.js";
import { GetPulumiService } from "~/abstractions/services/GetPulumiService.js";
import { PulumiSelectStackService } from "~/abstractions/services/PulumiSelectStackService.js";
import { createEnvConfiguration } from "@webiny/project/utils/env/index.js";
import { withPulumiConfigPassphrase } from "~/utils/withPulumiConfigPassphrase.js";

export class DefaultGetAppOutput implements GetAppOutput.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private buildAppWorkspaceService: BuildAppWorkspaceService.Interface,
        private pulumiSelectStackService: PulumiSelectStackService.Interface,
        private getPulumiService: GetPulumiService.Interface
    ) {}

    async execute(params: GetAppOutput.Params) {
        await this.buildAppWorkspaceService.execute(params.app);

        const app = this.getApp.execute(params.app);

        await this.pulumiSelectStackService.execute(app);

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

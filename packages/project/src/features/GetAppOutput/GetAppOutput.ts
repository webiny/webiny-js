import { createImplementation } from "@webiny/di-container";
import {
    EnsureAppWorkspaceService,
    GetApp,
    GetAppOutput,
    GetPulumiService,
    PulumiSelectStackService
} from "~/abstractions/index.js";
import { createEnvConfiguration, withPulumiConfigPassphrase } from "~/utils/env/index.js";

export class DefaultGetAppOutput implements GetAppOutput.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private ensureAppWorkspaceService: EnsureAppWorkspaceService.Interface,
        private pulumiSelectStackService: PulumiSelectStackService.Interface,
        private getPulumiService: GetPulumiService.Interface
    ) {}

    async execute(params: GetAppOutput.Params) {
        await this.ensureAppWorkspaceService.execute(params);

        const app = this.getApp.execute(params.app);

        if (!params.env) {
            throw new Error(`Please specify environment, for example "dev".`);
        }

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
    dependencies: [GetApp, EnsureAppWorkspaceService, PulumiSelectStackService, GetPulumiService]
});

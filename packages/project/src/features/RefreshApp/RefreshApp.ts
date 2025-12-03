import { createImplementation } from "@webiny/di";
import {
    RefreshApp,
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

export class DefaultRefreshApp implements RefreshApp.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private getProject: GetProject.Interface,
        private pulumiSelectStackService: PulumiSelectStackService.Interface,
        private getPulumiService: GetPulumiService.Interface
    ) {}

    async execute(params: RefreshApp.Params) {
        const app = this.getApp.execute(params.app);

        if (!params.env) {
            throw new Error(`Please specify environment, for example "dev".`);
        }

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
                command: "refresh",
                args: {
                    yes: true
                },
                execa: { env }
            })
        };
    }
}

export const refreshApp = createImplementation({
    abstraction: RefreshApp,
    implementation: DefaultRefreshApp,
    dependencies: [GetApp, GetProject, PulumiSelectStackService, GetPulumiService]
});

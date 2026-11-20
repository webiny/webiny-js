import { createImplementation } from "@webiny/di";
import { RefreshApp } from "~/abstractions/features/RefreshApp.js";
import { GetApp } from "@webiny/project/abstractions/index.js";
import { GetProject } from "@webiny/project/abstractions/index.js";
import { ProjectSdkParamsService } from "@webiny/project/abstractions/index.js";
import { GetPulumiService } from "~/abstractions/services/GetPulumiService.js";
import { PulumiSelectStackService } from "~/abstractions/services/PulumiSelectStackService.js";
import { createEnvConfiguration } from "@webiny/project/utils/env/index.js";
import { withEnv } from "@webiny/project/utils/env/index.js";
import { withEnvVariant } from "@webiny/project/utils/env/index.js";
import { withProjectName } from "@webiny/project/utils/env/index.js";
import { withRegion } from "@webiny/project/utils/env/index.js";
import { withPulumiConfigPassphrase } from "~/utils/withPulumiConfigPassphrase.js";

export class DefaultRefreshApp implements RefreshApp.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private getProject: GetProject.Interface,
        private pulumiSelectStackService: PulumiSelectStackService.Interface,
        private getPulumiService: GetPulumiService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface
    ) {}

    async execute(params: RefreshApp.Params) {
        const app = this.getApp.execute(params.app);
        const sdkParams = this.projectSdkParamsService.get();

        if (!sdkParams.env) {
            throw new Error(`Please specify environment, for example "dev".`);
        }

        await this.pulumiSelectStackService.execute(app);

        const pulumi = await this.getPulumiService.execute({ app });
        const project = await this.getProject.execute();

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
    dependencies: [
        GetApp,
        GetProject,
        PulumiSelectStackService,
        GetPulumiService,
        ProjectSdkParamsService
    ]
});

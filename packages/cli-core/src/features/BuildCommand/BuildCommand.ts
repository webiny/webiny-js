import { createImplementation } from "@webiny/di";
import {
    CliCommandFactory,
    GetProjectSdkService,
    StdioService,
    UiService
} from "~/abstractions/index.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";
import { BuildRunner } from "~/features/BuildCommand/buildRunners/BuildRunner.js";
import { createBaseAppOptions } from "~/features/common/index.js";

export interface IBuildCommandParams extends IBaseAppParams {
    analyze?: boolean;
}

export class BuildCommand implements CliCommandFactory.Interface<IBuildCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private stdioService: StdioService.Interface,
        private ui: UiService.Interface
    ) {}

    async execute(): Promise<CliCommandFactory.CommandDefinition<IBuildCommandParams>> {
        const projectSdk = await this.getProjectSdkService.execute();

        return {
            name: "build",
            description: "Builds specified app",
            examples: ["$0 build api --env dev", "$0 build admin --env prod"],
            params: [
                {
                    name: "app",
                    description: "Name of the app (core, admin, or api)",
                    type: "string",
                    required: true
                }
            ],
            options: [
                ...createBaseAppOptions(projectSdk),
                {
                    name: "analyze",
                    description: "Run bundle analysis during build",
                    type: "boolean"
                }
            ],
            handler: async (params: IBuildCommandParams) => {
                if (params.analyze) {
                    // Set directly on process.env so forked build processes
                    // (RunnableBuildProcess) inherit it automatically via { ...process.env }.
                    // rsbuild detects RSDOCTOR=true and enables bundle analysis natively.
                    process.env.RSDOCTOR = "true";
                }

                const stdio = this.stdioService;
                const ui = this.ui;

                const packagesBuilder = await projectSdk.buildApp(params);

                const buildRunner = new BuildRunner({
                    stdio,
                    ui,
                    packagesBuilder
                });

                return buildRunner.run();
            }
        };
    }
}

export const buildCommand = createImplementation({
    abstraction: CliCommandFactory,
    implementation: BuildCommand,
    dependencies: [GetProjectSdkService, StdioService, UiService]
});

import { createImplementation } from "@webiny/di";
import { CliCommand, GetProjectSdkService, StdioService, UiService } from "~/abstractions/index.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";
import { BuildRunner } from "~/features/BuildCommand/buildRunners/BuildRunner.js";
import { createBaseAppOptions } from "~/features/common/index.js";

export type IBuildCommandParams = IBaseAppParams;

export class BuildCommand implements CliCommand.Interface<IBuildCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private stdioService: StdioService.Interface,
        private ui: UiService.Interface
    ) {}

    async execute(): Promise<CliCommand.CommandDefinition<IBuildCommandParams>> {
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
            options: [...createBaseAppOptions(projectSdk)],
            handler: async (params: IBuildCommandParams) => {
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
    abstraction: CliCommand,
    implementation: BuildCommand,
    dependencies: [GetProjectSdkService, StdioService, UiService]
});

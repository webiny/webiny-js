import { createImplementation } from "@webiny/di";
import { CliCommand, GetProjectSdkService, StdioService } from "~/abstractions/index.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";
import {
    createEnvOption,
    createRegionOption,
    createVariantOption
} from "~/features/common/index.js";

export interface IOutputCommandParams extends IBaseAppParams {
    json?: boolean;
}

export class OutputCommand implements CliCommand.Interface<IOutputCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private stdioService: StdioService.Interface
    ) {}

    async execute(): Promise<CliCommand.CommandDefinition<IOutputCommandParams>> {
        const projectSdk = await this.getProjectSdkService.execute();

        return {
            name: "output",
            description: "Prints Pulumi stack output for given project application and environment",
            params: [
                {
                    name: "app",
                    description: "Name of the app (core, admin, or api)",
                    type: "string",
                    required: true
                }
            ],
            options: [
                createEnvOption(),
                createVariantOption(projectSdk, {
                    description: "Variant of the app to watch"
                }),
                createRegionOption(projectSdk),
                {
                    name: "json",
                    description: "Emit output as JSON",
                    type: "boolean"
                }
            ],
            handler: async (params: IOutputCommandParams) => {
                const projectSdk = await this.getProjectSdkService.execute();
                const stdio = this.stdioService;

                const { pulumiProcess } = await projectSdk.getAppOutput(params);

                pulumiProcess.stdout!.pipe(stdio.getStdout());
            }
        };
    }
}

export const outputCommand = createImplementation({
    abstraction: CliCommand,
    implementation: OutputCommand,
    dependencies: [GetProjectSdkService, StdioService]
});

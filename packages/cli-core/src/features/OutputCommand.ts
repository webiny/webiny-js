import { createImplementation } from "@webiny/di";
import { CliCommand, GetProjectSdkService, UiService } from "~/abstractions/index.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";
import { createBaseAppOptions } from "~/features/common/index.js";

export interface IOutputCommandParams extends IBaseAppParams {
    json?: boolean;
}

export class OutputCommand implements CliCommand.Interface<IOutputCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface
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
                ...createBaseAppOptions(projectSdk, {
                    variant: {
                        description: "Variant of the app to watch"
                    }
                }),
                {
                    name: "json",
                    description: "Emit output as JSON",
                    type: "boolean"
                }
            ],
            handler: async (params: IOutputCommandParams) => {
                const projectSdk = await this.getProjectSdkService.execute();
                const ui = this.uiService;
                
                const output = await projectSdk.getAppStackOutput(params.app);
                if (params.json) {
                    ui.text(JSON.stringify(output, null, 2));
                    return;
                }

                // Nice indentation for console output.
                if (!output || Object.keys(output).length === 0) {
                    ui.text("No output values found.");
                    return;
                }

                // HERE

            }
        };
    }
}

export const outputCommand = createImplementation({
    abstraction: CliCommand,
    implementation: OutputCommand,
    dependencies: [GetProjectSdkService, UiService]
});

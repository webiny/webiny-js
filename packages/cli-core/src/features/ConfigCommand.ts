import { createImplementation } from "@webiny/di";
import { CliCommand, GetProjectSdkService, UiService } from "~/abstractions/index.js";
import { createBaseAppOptions } from "~/features/common/index.js";

export interface IConfigCommandParams {
    env?: string;
    region?: string;
    variant?: string;
    json?: boolean;
    extensionType?: string;
    t?: string;
}

export class ConfigCommand implements CliCommand.Interface<IConfigCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute(): Promise<CliCommand.CommandDefinition<IConfigCommandParams>> {
        const projectSdk = await this.getProjectSdkService.execute();

        return {
            name: "config",
            description: "Prints the current project configuration",
            options: [
                ...createBaseAppOptions(projectSdk),
                {
                    name: "extension-type",
                    alias: "t",
                    description: "Filter by extension type",
                    type: "string"
                },
                {
                    name: "json",
                    description: "Emit output as JSON",
                    type: "boolean",
                    default: true
                }
            ],
            handler: async (params: IConfigCommandParams) => {
                const ui = this.uiService;

                // Get a ProjectSdk instance with the specified env/region/variant params
                // ProjectSdk.init handles caching internally based on these parameters
                const projectSdk = await this.getProjectSdkService.execute();

                const projectConfig = await projectSdk.getProjectConfig();

                // Get the extension type from either --extension-type or -t
                const extensionType = params.extensionType || params.t;

                let output: string;
                if (extensionType) {
                    // Filter extensions by type
                    const extensions = projectConfig.config[extensionType];
                    if (!extensions) {
                        ui.warning(`Extension type %s not found in configuration.`, extensionType);
                        ui.emptyLine()
                        ui.info("Available extension types:");
                        Object.keys(projectConfig.config).forEach(type => {
                            ui.text(`  - ${type}`);
                        });
                        return;
                    }
                    output = JSON.stringify(extensions, null, 2);
                } else {
                    // Show full config
                    output = JSON.stringify(projectConfig.config, null, 2);
                }

                ui.raw(output);
            }
        };
    }
}

export const configCommand = createImplementation({
    abstraction: CliCommand,
    implementation: ConfigCommand,
    dependencies: [GetProjectSdkService, UiService]
});

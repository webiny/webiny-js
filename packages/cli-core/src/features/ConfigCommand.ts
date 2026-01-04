import { createImplementation } from "@webiny/di";
import { CliCommand, GetProjectSdkService, UiService } from "~/abstractions/index.js";
import { createBaseAppOptions } from "~/features/common/index.js";

export interface IConfigCommandParams {
    env?: string;
    region?: string;
    variant?: string;
    json?: boolean;
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
            options: createBaseAppOptions(projectSdk),
            handler: async () => {
                const ui = this.uiService;

                // Get a ProjectSdk instance with the specified env/region/variant params
                // ProjectSdk.init handles caching internally based on these parameters
                const projectSdk = await this.getProjectSdkService.execute();

                const projectConfig = await projectSdk.getProjectConfig();

                ui.raw(JSON.stringify(projectConfig.config, null, 2));
            }
        };
    }
}

export const configCommand = createImplementation({
    abstraction: CliCommand,
    implementation: ConfigCommand,
    dependencies: [GetProjectSdkService, UiService]
});

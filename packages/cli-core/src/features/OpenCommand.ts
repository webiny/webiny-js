import { createImplementation } from "@webiny/di";
import { CliCommand, GetProjectSdkService, UiService } from "~/abstractions/index.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";
import { createBaseAppOptions } from "~/features/common/index.js";
import open from "open";

export type IOpenCommandParams = Omit<IBaseAppParams, "app">;

export class OpenCommand implements CliCommand.Interface<IOpenCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute(): Promise<CliCommand.CommandDefinition<IOpenCommandParams>> {
        const projectSdk = await this.getProjectSdkService.execute();
        const ui = this.uiService;

        return {
            name: "open",
            description: "Quickly open Admin application in your default browser",
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
            handler: async (args: IOpenCommandParams) => {
                ui.info(`Opening %s...`, "Admin app");

                const appOutput = await projectSdk.getAppStackOutput<{ appUrl: string }>("admin");

                if (!appOutput) {
                    throw new Error(
                        `Could not retrieve URL for "Admin app". Please make sure you've deployed the project first.`
                    );
                }

                const { appUrl } = appOutput;
                if (!appUrl) {
                    throw new Error(
                        `Could not retrieve URL for "Admin app" ("appUrl" property missing). Please make sure you've deployed the project first.`
                    );
                }

                return new Promise<void>(resolve => {
                    setTimeout(() => {
                        ui.success(`Successfully opened %s.`, "Admin app");
                        open(appUrl);
                        resolve();
                    }, 1000);
                });
            }
        };
    }
}

export const openCommand = createImplementation({
    abstraction: CliCommand,
    implementation: OpenCommand,
    dependencies: [GetProjectSdkService, UiService]
});

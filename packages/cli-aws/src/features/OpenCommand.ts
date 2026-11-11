import { createImplementation } from "@webiny/di";
import { CliCommandFactory } from "@webiny/cli-core/abstractions/index.js";
import { UiService } from "@webiny/cli-core/abstractions/index.js";
import { IBaseAppParams } from "@webiny/cli-core/abstractions/features/types.js";
import { createBaseAppOptions } from "@webiny/cli-core/features/common/index.js";
import { GetAwsProjectSdkService } from "~/abstractions/GetAwsProjectSdkService.js";
import open from "open";

export type IOpenCommandParams = Omit<IBaseAppParams, "app">;

export class OpenCommand implements CliCommandFactory.Interface<IOpenCommandParams> {
    constructor(
        private getAwsProjectSdkService: GetAwsProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute(): Promise<CliCommandFactory.CommandDefinition<IOpenCommandParams>> {
        const projectSdk = await this.getAwsProjectSdkService.execute();
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
            handler: async () => {
                ui.info(`Opening %s...`, "Admin app");

                const appOutput = await projectSdk.getAppStackOutput<{
                    appUrl: string;
                }>("admin");

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
    abstraction: CliCommandFactory,
    implementation: OpenCommand,
    dependencies: [GetAwsProjectSdkService, UiService]
});

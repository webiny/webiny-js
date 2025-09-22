import { createImplementation } from "@webiny/di-container";
import { Command, GetProjectSdkService, UiService } from "~/abstractions/index.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";
import open from "open";

export type IOpenCommandParams = Omit<IBaseAppParams, "app">;

export class OpenCommand implements Command.Interface<IOpenCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute(): Promise<Command.CommandDefinition<IOpenCommandParams>> {
        const projectSdk = await this.getProjectSdkService.execute();
        const ui = this.uiService;

        return {
            name: "open",
            description: "Quickly open Admin application in your default browser",
            options: [
                {
                    name: "env",
                    description: "Environment name (dev, prod, etc.)",
                    type: "string",
                    required: true
                },
                {
                    name: "variant",
                    description: "Variant of the app to watch",
                    type: "string",
                    validation: params => {
                        const isValid = projectSdk.isValidVariantName(params.variant);
                        if (isValid.isErr()) {
                            throw isValid.error;
                        }
                        return true;
                    }
                },
                {
                    name: "region",
                    description: "Region to target",
                    type: "string",
                    validation: params => {
                        const isValid = projectSdk.isValidRegionName(params.region);
                        if (isValid.isErr()) {
                            throw isValid.error;
                        }
                        return true;
                    }
                },
                {
                    name: "json",
                    description: "Emit output as JSON",
                    type: "boolean"
                }
            ],
            handler: async (args: IOpenCommandParams) => {
                ui.info(`Opening %s...`, "Admin app");

                const appOutput = await projectSdk.getAppStackOutput<{ appUrl: string }>({
                    app: "admin",
                    env: args.env,
                    variant: args.variant
                });

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

                return new Promise(resolve => {
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
    abstraction: Command,
    implementation: OpenCommand,
    dependencies: [GetProjectSdkService, UiService]
});

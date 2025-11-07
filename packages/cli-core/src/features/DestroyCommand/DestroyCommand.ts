import { createImplementation } from "@webiny/di";
import { Command, GetProjectSdkService, StdioService, UiService } from "~/abstractions/index.js";
import { measureDuration } from "~/features/utils/index.js";
import { PulumiError } from "@webiny/pulumi-sdk";
import { AppName } from "@webiny/project";

export interface IDestroyNoAppParams {
    variant?: string;
    region?: string;
    env: string;
}

export interface IDestroyWithAppParams extends IDestroyNoAppParams {
    app: AppName;
    build?: boolean;
    preview?: boolean;
}

export type IDestroyCommandParams = IDestroyNoAppParams | IDestroyWithAppParams;

export class DestroyCommand implements Command.Interface<IDestroyCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface,
        private stdioService: StdioService.Interface
    ) {}

    async execute(): Promise<Command.CommandDefinition<IDestroyCommandParams>> {
        const projectSdk = await this.getProjectSdkService.execute();

        return {
            name: "destroy",
            description: "Destroys specified app or all apps in the project",
            examples: [
                "$0 destroy api --env dev",
                "$0 destroy admin --env prod",
                "$0 destroy --env prod",
                "$0 destroy"
            ],
            params: [
                {
                    name: "app",
                    description: "Name of the app (core, admin, or api)",
                    type: "string"
                }
            ],
            options: [
                {
                    name: "env",
                    description: "Environment name (dev, prod, etc.)",
                    type: "string",
                    default: "dev",
                    validation: params => {
                        if ("app" in params && !params.env) {
                            throw new Error("Environment name is required when destroying an app.");
                        }
                        return true;
                    }
                },
                {
                    name: "variant",
                    description: "Variant of the app to destroy",
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
                }
            ],
            handler: async (params: IDestroyCommandParams) => {
                if ("app" in params) {
                    return this.destroyApp(params);
                }

                // Destroy all apps in the project.
                await this.destroyApp({ ...params, app: "admin" });
                await this.destroyApp({ ...params, app: "api" });
                await this.destroyApp({ ...params, app: "core" });
            }
        };
    }

    private async destroyApp(params: IDestroyWithAppParams) {
        const projectSdk = await this.getProjectSdkService.execute();
        const ui = this.uiService;
        const stdio = this.stdioService;

        const { pulumiProcess } = await projectSdk.destroyApp(params);

        const getDestroyDuration = measureDuration();

        try {
            ui.info(`Destroying %s app...`, params.app);

            ui.newLine();

            pulumiProcess.stdout!.pipe(stdio.getStdout());
            pulumiProcess.stderr!.pipe(stdio.getStderr());
            await pulumiProcess;

            ui.success(`Destroyed in ${getDestroyDuration()}.`);
        } catch (e) {
            // If Pulumi error, we don't need to show the error message, as it will be shown by Pulumi.
            if (e instanceof PulumiError) {
                ui.error("Destroy failed, please check the details above.");
            } else {
                ui.text(e.message);
                ui.error("Destroy failed, please check the details above.");
            }

            throw e;
        }
    }
}

export const destroyCommand = createImplementation({
    abstraction: Command,
    implementation: DestroyCommand,
    dependencies: [GetProjectSdkService, UiService, StdioService]
});

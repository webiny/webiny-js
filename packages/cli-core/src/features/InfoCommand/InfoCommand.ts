import { createImplementation } from "@webiny/di";
import { CliCommand, GetProjectSdkService, UiService } from "~/abstractions/index.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";
import { PrintInfoForEnv } from "./PrintInfoForEnv.js";
import { createBaseAppOptions } from "~/features/common/index.js";

export type IInfoCommandParams = Omit<IBaseAppParams, "app">;

export class InfoCommand implements CliCommand.Interface<IInfoCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute(): Promise<CliCommand.CommandDefinition<IInfoCommandParams>> {
        const projectSdk = await this.getProjectSdkService.execute();

        return {
            name: "info",
            description: "Lists relevant URLs for your Webiny project",
            options: [
                ...createBaseAppOptions(projectSdk, {
                    variant: {
                        description: "Variant of the app to watch"
                    }
                }).filter(opt => opt.name !== "region")
            ],

            handler: async params => {
                const ui = this.uiService;

                const printInfoForEnv = new PrintInfoForEnv({
                    getProjectSdkService: this.getProjectSdkService,
                    uiService: this.uiService
                });

                if (params.env) {
                    await printInfoForEnv.execute({ env: params.env, variant: params.variant });
                    ui.newLine();
                } else {
                    const existingEnvs = await projectSdk.listDeployedEnvironments();

                    if (existingEnvs.length === 0) {
                        ui.info(
                            "It seems that no environments have been deployed yet. Please deploy the project first."
                        );
                        return;
                    }

                    if (existingEnvs.length === 1) {
                        ui.info("There is one deployed environment.");
                        ui.info("Here is the information for the environment.");
                    } else {
                        ui.info(
                            "There's a total of %d deployed environments.",
                            existingEnvs.length
                        );
                        ui.info("Here is the information for each environment.");
                        console.log();
                    }

                    for (const { env, variant } of existingEnvs) {
                        await printInfoForEnv.execute({ env, variant });
                        ui.newLine();
                    }
                }

                ui.info(
                    "If some of the information is missing for a particular environment, make sure that the project has been fully deployed into that environment. You can do that by running the %s command.",
                    "yarn webiny deploy --env {ENVIRONMENT_NAME}"
                );
            }
        };
    }
}

export const infoCommand = createImplementation({
    abstraction: CliCommand,
    implementation: InfoCommand,
    dependencies: [GetProjectSdkService, UiService]
});

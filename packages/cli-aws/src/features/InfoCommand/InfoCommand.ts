import { createImplementation } from "@webiny/di";
import { CliCommandFactory } from "@webiny/cli-core/abstractions/index.js";
import { UiService } from "@webiny/cli-core/abstractions/index.js";
import { IBaseAppParams } from "@webiny/cli-core/abstractions/features/types.js";
import { PrintInfoForEnv } from "./PrintInfoForEnv.js";
import { createBaseAppOptions } from "@webiny/cli-core/features/common/index.js";
import { GetAwsProjectSdkService } from "~/abstractions/GetAwsProjectSdkService.js";

export type IInfoCommandParams = Omit<IBaseAppParams, "app">;

export class InfoCommand implements CliCommandFactory.Interface<IInfoCommandParams> {
    constructor(
        private getAwsProjectSdkService: GetAwsProjectSdkService.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute(): Promise<CliCommandFactory.CommandDefinition<IInfoCommandParams>> {
        const projectSdk = await this.getAwsProjectSdkService.execute();

        return {
            name: "info",
            description: "Lists relevant URLs for your Webiny project",
            // No default env here: without `--env`, we list info for all deployed environments.
            options: createBaseAppOptions(projectSdk, { env: { default: undefined } }),
            handler: async params => {
                const ui = this.uiService;

                const printInfoForEnv = new PrintInfoForEnv({
                    getAwsProjectSdkService: this.getAwsProjectSdkService,
                    uiService: this.uiService
                });

                if (params.env) {
                    await printInfoForEnv.execute({ env: params.env, variant: params.variant });
                    ui.emptyLine();
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
                        ui.emptyLine();
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
    abstraction: CliCommandFactory,
    implementation: InfoCommand,
    dependencies: [GetAwsProjectSdkService, UiService]
});

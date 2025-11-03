import { createImplementation } from "@webiny/di";
import { Command, GetProjectSdkService, StdioService, UiService } from "~/abstractions/index.js";
import { ManuallyReportedError } from "~/utils/ManuallyReportedError.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";

export interface IPulumiCommandParams extends IBaseAppParams {
    command: string[];
}

export class PulumiCommand implements Command.Interface<IPulumiCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface,
        private stdioService: StdioService.Interface
    ) {}

    async execute(): Promise<Command.CommandDefinition<IPulumiCommandParams>> {
        const projectSdk = await this.getProjectSdkService.execute();

        return {
            name: "pulumi",
            description:
                'Runs a Pulumi command in the provided project application folder. Note: make sure to use "--" before the actual Pulumi command',
            examples: ["$0 pulumi api --env dev -- config set foo bar --secret"],
            params: [
                {
                    name: "app",
                    description: "Name of the app (core, admin, or api)",
                    type: "string",
                    required: true
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
                            throw new Error("Environment name is required.");
                        }
                        return true;
                    }
                },
                {
                    name: "variant",
                    description: "Variant of the app to pulumi",
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
            handler: async (params: IPulumiCommandParams) => {
                const projectSdk = await this.getProjectSdkService.execute();

                try {
                    const [, ...command] = params._;

                    const { pulumiProcess } = await projectSdk.runPulumiCommand({
                        ...params,
                        command
                    });

                    pulumiProcess.stdin?.pipe(this.stdioService.getStdin());
                    pulumiProcess.stdout?.pipe(this.stdioService.getStdout());
                    pulumiProcess.stderr?.pipe(this.stdioService.getStderr());
                } catch (error) {
                    throw ManuallyReportedError.from(error);
                }
            }
        };
    }
}

export const pulumiCommand = createImplementation({
    abstraction: Command,
    implementation: PulumiCommand,
    dependencies: [GetProjectSdkService, UiService, StdioService]
});

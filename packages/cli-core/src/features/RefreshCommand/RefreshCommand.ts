import { createImplementation } from "@webiny/di";
import { Command, GetProjectSdkService, StdioService } from "~/abstractions/index.js";
import { ManuallyReportedError } from "~/utils/ManuallyReportedError.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";

export interface IRefreshCommandParams extends IBaseAppParams {
    command: string[];
}

export class RefreshCommand implements Command.Interface<IRefreshCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private stdioService: StdioService.Interface
    ) {}

    async execute(): Promise<Command.CommandDefinition<IRefreshCommandParams>> {
        const projectSdk = await this.getProjectSdkService.execute();

        return {
            name: "refresh",
            description: "Refreshes Pulumi state for given project application and environment",
            examples: ["$0 refresh api --env dev -- config set foo bar --secret"],
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
                    description: "Variant of the app to refresh",
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
            handler: async (params: IRefreshCommandParams) => {
                const projectSdk = await this.getProjectSdkService.execute();

                try {
                    const { pulumiProcess } = await projectSdk.refreshApp(params);
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

export const refreshCommand = createImplementation({
    abstraction: Command,
    implementation: RefreshCommand,
    dependencies: [GetProjectSdkService, StdioService]
});

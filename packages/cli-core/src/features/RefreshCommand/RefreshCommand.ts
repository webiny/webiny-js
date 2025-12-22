import { createImplementation } from "@webiny/di";
import { CliCommand, GetProjectSdkService, StdioService } from "~/abstractions/index.js";
import { ManuallyReportedError } from "~/utils/ManuallyReportedError.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";
import {
    createEnvOption,
    createRegionOption,
    createVariantOption
} from "~/features/common/index.js";

export interface IRefreshCommandParams extends IBaseAppParams {
    command: string[];
}

export class RefreshCommand implements CliCommand.Interface<IRefreshCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private stdioService: StdioService.Interface
    ) {}

    async execute(): Promise<CliCommand.CommandDefinition<IRefreshCommandParams>> {
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
                createEnvOption({
                    validation: params => {
                        if ("app" in params && !params.env) {
                            throw new Error("Environment name is required.");
                        }
                        return true;
                    }
                }),
                createVariantOption(projectSdk, {
                    description: "Variant of the app to refresh"
                }),
                createRegionOption(projectSdk)
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
    abstraction: CliCommand,
    implementation: RefreshCommand,
    dependencies: [GetProjectSdkService, StdioService]
});

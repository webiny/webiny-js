import { createImplementation } from "@webiny/di";
import { CliCommandFactory, GetProjectSdkService, StdioService } from "~/abstractions/index.js";
import { ManuallyReportedError } from "~/utils/ManuallyReportedError.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";
import { createBaseAppOptions } from "~/features/common/index.js";

export interface IRefreshCommandParams extends IBaseAppParams {
    command: string[];
}

export class RefreshCommand implements CliCommandFactory.Interface<IRefreshCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private stdioService: StdioService.Interface
    ) {}

    async execute(): Promise<CliCommandFactory.CommandDefinition<IRefreshCommandParams>> {
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
            options: createBaseAppOptions(projectSdk),
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
    abstraction: CliCommandFactory,
    implementation: RefreshCommand,
    dependencies: [GetProjectSdkService, StdioService]
});

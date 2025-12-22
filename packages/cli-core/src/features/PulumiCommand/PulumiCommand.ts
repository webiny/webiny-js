import { createImplementation } from "@webiny/di";
import { CliCommand, GetProjectSdkService, StdioService, UiService } from "~/abstractions/index.js";
import { ManuallyReportedError } from "~/utils/ManuallyReportedError.js";
import { IBaseAppParams } from "~/abstractions/features/types.js";
import { createBaseAppOptions } from "~/features/common/index.js";

export interface IPulumiCommandParams extends IBaseAppParams {
    command: string[];
}

export class PulumiCommand implements CliCommand.Interface<IPulumiCommandParams> {
    constructor(
        private getProjectSdkService: GetProjectSdkService.Interface,
        private uiService: UiService.Interface,
        private stdioService: StdioService.Interface
    ) {}

    async execute(): Promise<CliCommand.CommandDefinition<IPulumiCommandParams>> {
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
            options: createBaseAppOptions(projectSdk),
            handler: async (params: IPulumiCommandParams) => {
                const projectSdk = await this.getProjectSdkService.execute();

                try {
                    const [, ...command] = params._ || [];

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
    abstraction: CliCommand,
    implementation: PulumiCommand,
    dependencies: [GetProjectSdkService, UiService, StdioService]
});

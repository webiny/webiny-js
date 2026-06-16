import { createImplementation } from "@webiny/di";
import { GetAppStackOutput } from "@webiny/project/abstractions/index.js";
import { type AppName } from "@webiny/project/abstractions/types.js";

// In server flavor there is no Pulumi deployment, so stack output is not meaningful.
// Returning a non-empty object lets all EnsureApiDeployed* hooks pass immediately.
class ServerGetAppStackOutput implements GetAppStackOutput.Interface {
    async execute<TOutput extends GetAppStackOutput.StackOutput = GetAppStackOutput.StackOutput>(
        _appName: AppName
    ): Promise<TOutput | null> {
        return { noDeployment: true } as unknown as TOutput;
    }
}

export const serverGetAppStackOutput = createImplementation({
    abstraction: GetAppStackOutput,
    implementation: ServerGetAppStackOutput,
    dependencies: []
});

import { createImplementation } from "@webiny/di";
import { GetAppStackOutput } from "@webiny/project/abstractions/index.js";
import { type AppName } from "@webiny/project/abstractions/types.js";

// In server flavor there is no Pulumi deployment, so stack output is synthesized.
// It must be non-empty so all EnsureApiDeployed* hooks pass immediately. For the "api" app we also
// return the local API URL, because AWS's SetAdminEnvVars hook (which also runs in this flavor)
// reads `output.apiUrl` to bake REACT_APP_API_URL / REACT_APP_GRAPHQL_API_URL — without it those
// become the literal string "undefined" (admin would hit /undefined/graphql).
class ServerGetAppStackOutput implements GetAppStackOutput.Interface {
    async execute<TOutput extends GetAppStackOutput.StackOutput = GetAppStackOutput.StackOutput>(
        appName: AppName
    ): Promise<TOutput | null> {
        if (appName === "api") {
            const port = process.env.WEBINY_API_PORT || "3000";
            const apiUrl = process.env.WEBINY_API_URL || `http://localhost:${port}`;
            return { apiUrl, region: "local" } as unknown as TOutput;
        }

        return { noDeployment: true } as unknown as TOutput;
    }
}

export const serverGetAppStackOutput = createImplementation({
    abstraction: GetAppStackOutput,
    implementation: ServerGetAppStackOutput,
    dependencies: []
});

import { Container } from "@webiny/di";
import { serverBuildAppWorkspaceService } from "./services/ServerBuildAppWorkspaceService.js";
import { serverGetAppStackOutput } from "./features/ServerGetAppStackOutput.js";

export const registerServerProjectFeatures = (container: Container): void => {
    // Replace the default (AWS) workspace builder with the server-flavour one.
    // The server workspace has no Pulumi scaffolding — only app source templates.
    container.register(serverBuildAppWorkspaceService).inSingletonScope();
    // No-op stack output: server flavor has no Pulumi deployment, so all
    // EnsureApiDeployed* hooks pass immediately without blocking builds.
    container.register(serverGetAppStackOutput).inSingletonScope();
};

import { Container } from "@webiny/di";
import { serverBuildAppWorkspaceService } from "./services/ServerBuildAppWorkspaceService.js";

export const registerServerProjectFeatures = (container: Container): void => {
    // Replace the default (AWS) workspace builder with the server-flavour one.
    // The server workspace has no Pulumi scaffolding — only app source templates.
    container.register(serverBuildAppWorkspaceService).inSingletonScope();
};

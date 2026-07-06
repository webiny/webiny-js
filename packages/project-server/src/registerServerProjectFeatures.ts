import { Container } from "@webiny/di";
import { serverBuildAppWorkspaceService } from "./services/ServerBuildAppWorkspaceService.js";
import { BuildServerProjectWorkspace } from "./features/BuildServerProjectWorkspace.js";
import { SetServerAdminEnvVarsBeforeWatch } from "./features/SetServerAdminEnvVars/SetServerAdminEnvVarsBeforeWatch.js";

export const registerServerProjectFeatures = (container: Container): void => {
    // Replace the default (AWS) workspace builder with the server-flavour one.
    // The server workspace has no Pulumi scaffolding — only app source templates.
    container.register(serverBuildAppWorkspaceService).inSingletonScope();
    // Copy the server `webiny.config.base.tsx` (renders <Project />, not <ProjectAws />) into the
    // workspace, so none of the AWS deploy/Pulumi hooks are composed in the self-hosted flavour.
    container.registerDecorator(BuildServerProjectWorkspace);
    // Hand the admin app the API URL before `watch admin` (no Pulumi output in this flavour).
    container.register(SetServerAdminEnvVarsBeforeWatch);
};

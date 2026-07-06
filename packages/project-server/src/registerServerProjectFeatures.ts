import { Container } from "@webiny/di";
import { serverBuildAppWorkspaceService } from "./services/ServerBuildAppWorkspaceService.js";
import { BuildServerProjectWorkspace } from "./features/BuildServerProjectWorkspace.js";

export const registerServerProjectFeatures = (container: Container): void => {
    // Replace the default (AWS) workspace builder with the server-flavour one.
    // The server workspace has no Pulumi scaffolding — only app source templates.
    container.register(serverBuildAppWorkspaceService).inSingletonScope();
    // Copy the server `webiny.config.base.tsx` (renders <Project />, not <ProjectAws />) into the
    // workspace, so none of the AWS deploy/Pulumi hooks are composed in the self-hosted flavour.
    container.registerDecorator(BuildServerProjectWorkspace);
    // The admin API URL is configured via `<Admin.ApiUrl>` in webiny.config.tsx (baked into the
    // bundle as WEBINY_ADMIN_API_URL), so no env-mutating watch hook is needed here.
};

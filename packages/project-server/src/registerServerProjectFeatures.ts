import { Container } from "@webiny/di";
import { serverBuildAppWorkspaceService } from "./services/ServerBuildAppWorkspaceService.js";
import { BuildServerProjectWorkspace } from "./features/BuildServerProjectWorkspace.js";
import { serverWatch } from "./features/Watch/ServerWatch.js";
import { serverServe } from "./serve/ServerServe.js";
import { serveWithBuildChecks } from "./serve/ServeWithBuildChecks.js";
import { PackageServerBuild } from "./features/PackageServerBuild.js";

export const registerServerProjectFeatures = (container: Container): void => {
    // Replace the default (AWS) workspace builder with the server hosting-type one.
    // The server workspace has no Pulumi scaffolding — only app source templates.
    container.register(serverBuildAppWorkspaceService).inSingletonScope();
    // Copy the server `webiny.config.base.tsx` (renders <Project />, not <ProjectAws />) into the
    // workspace, so none of the AWS deploy/Pulumi hooks are composed in the self-hosted hosting type.
    container.registerDecorator(BuildServerProjectWorkspace);
    // The admin API URL is configured via `<Admin.ApiUrl>` in webiny.config.tsx (baked into the
    // bundle as WEBINY_ADMIN_API_URL), so no env-mutating watch hook is needed here.
    // Boot the built api handler as a live, reload-on-rebuild HTTP server during `watch api`
    // (server hosting-type counterpart to project-aws's Lambda invocation forwarding).
    container.registerDecorator(serverWatch);

    // Serve built apps as long-running servers (`webiny-server serve`). Replace the base
    // DefaultServe (which refuses) with the real server hosting-type implementation, then decorate it so
    // the required app builds are asserted before anything is served.
    container.register(serverServe).inSingletonScope();
    container.registerDecorator(serveWithBuildChecks);

    // After the api build, assemble build/ into a self-contained, copy-deployable folder
    // (build/node_modules of externals + start.mjs + package.json). Build-time only (this ApiAfterBuild
    // hook doesn't run in watch); the deploy artifact packaging that belongs with the server hosting
    // type, not the generic bundler.
    container.register(PackageServerBuild);
};

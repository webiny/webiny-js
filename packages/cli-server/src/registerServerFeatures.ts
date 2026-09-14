import { Container } from "@webiny/di";
import { GetArgvService } from "@webiny/cli-core/abstractions/index.js";
import { prepareDevServerSession } from "@webiny/project-server/serve/devServer/index.js";
import { serverGetProjectSdkService } from "./services/GetProjectSdkService.js";
import { serverDefaultAppsService } from "./services/DefaultAppsService.js";
import { serverWatchCommand } from "./features/WatchCommand.js";
import { serverServeCommand } from "./features/ServeCommand.js";

export const registerServerFeatures = async (container: Container): Promise<void> => {
    // Override GetProjectSdkService so server project features are wired into the ProjectSdk container.
    container.register(serverGetProjectSdkService).inSingletonScope();

    // Server default apps: api + admin (used by no-arg build and watch).
    container.register(serverDefaultAppsService).inSingletonScope();

    // Watch command without Lambda-specific options.
    container.register(serverWatchCommand).inSingletonScope();

    // Serve command: run built apps as long-running servers (production).
    container.register(serverServeCommand).inSingletonScope();

    // Reserve the single-port dev proxy's ports and point the apps at each other. This has to happen
    // before webiny.config is evaluated, and this hook is the last point before that: the container
    // resolves the project SDK right after it returns, which evaluates the config and bakes in
    // whatever <Admin.ApiUrl> / <Infra.ApiUrl> resolve to. A command handler runs far too late.
    // Does nothing for commands that don't want a proxy.
    await prepareDevServerSession({ argv: container.resolve(GetArgvService).execute() });
};

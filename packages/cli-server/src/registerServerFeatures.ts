import { Container } from "@webiny/di";
import { serverGetProjectSdkService } from "./services/GetProjectSdkService.js";
import { serverDefaultAppsService } from "./services/DefaultAppsService.js";
import { serverWatchCommand } from "./features/WatchCommand.js";

export const registerServerFeatures = (container: Container): void => {
    // Override GetProjectSdkService so server project features are wired into the ProjectSdk container.
    container.register(serverGetProjectSdkService).inSingletonScope();

    // Server default apps: api + admin (used by no-arg build and watch).
    container.register(serverDefaultAppsService).inSingletonScope();

    // Watch command without Lambda-specific options.
    container.register(serverWatchCommand).inSingletonScope();
};

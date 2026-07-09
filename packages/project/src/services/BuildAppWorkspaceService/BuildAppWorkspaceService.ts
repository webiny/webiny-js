import { createImplementation } from "@webiny/di";
import { BuildAppWorkspaceService, GetApp, LoggerService } from "~/abstractions/index.js";
import fs from "fs";

export class DefaultBuildAppWorkspaceService implements BuildAppWorkspaceService.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private loggerService: LoggerService.Interface
    ) {}

    async execute(appName: GetApp.AppName, options: BuildAppWorkspaceService.Options = {}) {
        this.loggerService.debug({ appName, options }, "Building app workspace...");

        const app = this.getApp.execute(appName);

        if (app.paths.workspaceFolder.existsSync()) {
            if (options.forceRebuild !== true) {
                this.loggerService.debug(
                    { appName },
                    "App workspace already exists, skipping rebuild."
                );
                return;
            }
            fs.rmSync(app.paths.workspaceFolder.toString(), { recursive: true, force: true });
        }

        fs.mkdirSync(app.paths.workspaceFolder.toString(), { recursive: true });

        this.loggerService.debug({ appName }, "App workspace directory created.");
    }
}

export const buildAppWorkspaceService = createImplementation({
    abstraction: BuildAppWorkspaceService,
    implementation: DefaultBuildAppWorkspaceService,
    dependencies: [GetApp, LoggerService]
});

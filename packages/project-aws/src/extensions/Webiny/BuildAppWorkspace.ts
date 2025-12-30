import path from "path";
import fs from "fs";
import {
    BuildAppWorkspaceService,
    GetApp,
    LoggerService
} from "@webiny/project/abstractions/index.js";
import { getTemplatesFolderPath } from "~/utils/index.js";

class BuildAppWorkspaceImpl implements BuildAppWorkspaceService.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private logger: LoggerService.Interface,
        private decoratee: BuildAppWorkspaceService.Interface
    ) {}

    async execute(appName: GetApp.AppName, options: BuildAppWorkspaceService.Options = {}) {
        await this.decoratee.execute(appName, options);

        const app = this.getApp.execute(appName);

        if (app.paths.workspaceFolder.existsSync()) {
            if (options.forceRebuild !== true) {
                this.logger.debug(
                    { appName },
                    "App workspace already exists, skipping rebuild (project-aws)."
                );
                return;
            }
        }

        this.logger.info({ appName, options }, "Building app workspace (project-aws)...");

        const templatesFolderPath = getTemplatesFolderPath();
        const appWorkspaceFolderPath = app.paths.workspaceFolder.toString();
        const appTemplateFolderPath = path.join(templatesFolderPath, "appTemplates", app.name);

        // 4. Create app.
        fs.cpSync(appTemplateFolderPath, appWorkspaceFolderPath, { recursive: true });

        this.logger.info("App workspace built successfully (project-aws).");
    }
}

export const BuildAppWorkspace = BuildAppWorkspaceService.createDecorator({
    decorator: BuildAppWorkspaceImpl,
    dependencies: [GetApp, LoggerService]
});

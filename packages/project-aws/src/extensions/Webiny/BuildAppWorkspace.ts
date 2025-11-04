import { createDecorator } from "@webiny/di-container";
import path from "path";
import fs from "fs";
import {
    BuildAppWorkspaceService,
    GetApp,
    LoggerService
} from "@webiny/project/abstractions/index.js";
import { getTemplatesFolderPath } from "~/utils/index.js";

class BuildAppWorkspace implements BuildAppWorkspaceService.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private logger: LoggerService.Interface,
        private decoratee: BuildAppWorkspaceService.Interface
    ) {}

    async execute(params: BuildAppWorkspaceService.Params) {
        await this.decoratee.execute(params);

        this.logger.debug({ appName: params.app }, "Building app workspace...");
        const templatesFolderPath = getTemplatesFolderPath();

        const app = this.getApp.execute(params.app);

        const appWorkspaceFolderPath = app.paths.workspaceFolder.toString();
        const appTemplateFolderPath = path.join(templatesFolderPath, "appTemplates", app.name);

        // 4. Create app.
        fs.cpSync(appTemplateFolderPath, appWorkspaceFolderPath, { recursive: true });
    }
}

export default createDecorator({
    abstraction: BuildAppWorkspaceService,
    decorator: BuildAppWorkspace,
    dependencies: [GetApp, LoggerService]
});

import { createDecorator } from "@webiny/di-container";
import path from "path";
import fs from "fs";
import { EnsureAppWorkspaceService, GetApp } from "@webiny/project/abstractions/index.js";
import { getTemplatesFolderPath } from "~/utils/index.js";

class EnsureAppWorkspace implements EnsureAppWorkspaceService.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private decoratee: EnsureAppWorkspaceService.Interface
    ) {}

    async execute(params: EnsureAppWorkspaceService.Params) {
        await this.decoratee.execute(params);

        const templatesFolderPath = getTemplatesFolderPath();

        const app = this.getApp.execute(params.app);

        const appWorkspaceFolderPath = app.paths.workspaceFolder.toString();
        const appTemplateFolderPath = path.join(templatesFolderPath, "appTemplates", app.name);

        // 4. Create app.
        fs.cpSync(appTemplateFolderPath, appWorkspaceFolderPath, { recursive: true });
    }
}

export default createDecorator({
    abstraction: EnsureAppWorkspaceService,
    decorator: EnsureAppWorkspace,
    dependencies: [GetApp]
});

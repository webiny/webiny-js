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
        const result = await this.decoratee.execute(params);
        if (params.app === "api") {
            const templatesFolderPath = getTemplatesFolderPath();

            const app = this.getApp.execute("api");

            const appWorkspaceFolderPath = app.paths.workspaceFolder.toString();
            const apiLambdaFnHandlersFolderPath = path.join(
                templatesFolderPath,
                "extensions",
                "ElasticSearch",
                "api"
            );

            fs.cpSync(apiLambdaFnHandlersFolderPath, appWorkspaceFolderPath, {
                recursive: true,
                force: true
            });

            this.logger.debug("Replaced API Lambda function handlers with ElasticSearch versions.");
        }

        return result;
    }
}

export default createDecorator({
    abstraction: BuildAppWorkspaceService,
    decorator: BuildAppWorkspace,
    dependencies: [GetApp, LoggerService]
});

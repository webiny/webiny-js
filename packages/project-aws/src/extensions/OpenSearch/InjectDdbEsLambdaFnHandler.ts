import { createDecorator } from "@webiny/di";
import path from "path";
import fs from "fs";
import {
    BuildAppWorkspaceService,
    GetApp,
    LoggerService
} from "@webiny/project/abstractions/index.js";
import { getTemplatesFolderPath } from "~/utils/index.js";

class InjectDdbEsLambdaFnHandler implements BuildAppWorkspaceService.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private logger: LoggerService.Interface,
        private decoratee: BuildAppWorkspaceService.Interface
    ) {}

    async execute(params: BuildAppWorkspaceService.Params) {
        const result = await this.decoratee.execute(params);

        if (params.app === "core") {
            const templatesFolderPath = getTemplatesFolderPath();

            const app = this.getApp.execute("core");

            const appWorkspaceFolderPath = app.paths.workspaceFolder.toString();
            const ddbToEsHandlerTemplateFolderPath = path.join(
                templatesFolderPath,
                "extensions",
                "OpenSearch",
                "coreDdbToEsHandler"
            );

            fs.cpSync(ddbToEsHandlerTemplateFolderPath, appWorkspaceFolderPath, {
                recursive: true
            });

            this.logger.debug("Injected DDB to OpenSearch Lambda function handler.");
        }

        return result;
    }
}

export default createDecorator({
    abstraction: BuildAppWorkspaceService,
    decorator: InjectDdbEsLambdaFnHandler,
    dependencies: [GetApp, LoggerService]
});

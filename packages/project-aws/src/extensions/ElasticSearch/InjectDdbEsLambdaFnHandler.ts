import path from "path";
import fs from "fs";
import {
    BuildAppWorkspaceService,
    GetApp,
    LoggerService
} from "@webiny/project/abstractions/index.js";
import { getTemplatesFolderPath } from "~/utils/index.js";

class InjectDdbEsLambdaFnHandlerDecorator implements BuildAppWorkspaceService.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private logger: LoggerService.Interface,
        private decoratee: BuildAppWorkspaceService.Interface
    ) {}

    async execute(appName: GetApp.AppName, options: BuildAppWorkspaceService.Options) {
        const result = await this.decoratee.execute(appName, options);

        if (appName === "core") {
            const templatesFolderPath = getTemplatesFolderPath();

            const app = this.getApp.execute("core");

            const appWorkspaceFolderPath = app.paths.workspaceFolder.toString();
            const ddbToEsHandlerTemplateFolderPath = path.join(
                templatesFolderPath,
                "extensions",
                "ElasticSearch",
                "coreDdbToEsHandler"
            );

            fs.cpSync(ddbToEsHandlerTemplateFolderPath, appWorkspaceFolderPath, {
                recursive: true
            });

            this.logger.debug("Injected DDB to ElasticSearch Lambda function handler.");
        }

        return result;
    }
}

export const InjectDdbEsLambdaFnHandler = BuildAppWorkspaceService.createDecorator({
    decorator: InjectDdbEsLambdaFnHandlerDecorator,
    dependencies: [GetApp, LoggerService]
});

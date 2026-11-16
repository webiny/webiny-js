import path from "path";
import fs from "fs";
import {
    BuildAppWorkspaceService,
    GetApp,
    LoggerService
} from "@webiny/project/abstractions/index.js";
import { getTemplatesFolderPath } from "~/utils/index.js";

/**
 * With `<Infra.Postgres />`, the api workspace gets the Postgres entry file: it exports the handlers
 * from `@webiny/api-event-handler-aws-pg` instead of the DynamoDB ones. Every API function runs this
 * one bundle, so this puts all of them on Postgres.
 */
class ReplaceApiLambdaFnHandlersDecorator implements BuildAppWorkspaceService.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private logger: LoggerService.Interface,
        private decoratee: BuildAppWorkspaceService.Interface
    ) {}

    async execute(appName: GetApp.AppName, options: BuildAppWorkspaceService.Options = {}) {
        const result = await this.decoratee.execute(appName, options);
        if (appName !== "api") {
            return result;
        }

        const app = this.getApp.execute("api");
        const handlersFolderPath = path.join(
            getTemplatesFolderPath(),
            "extensions",
            "Postgres",
            "api"
        );

        fs.cpSync(handlersFolderPath, app.paths.workspaceFolder.toString(), {
            recursive: true,
            force: true
        });

        this.logger.debug("Replaced API Lambda function handlers with Postgres versions.");

        return result;
    }
}

export const ReplaceApiLambdaFnHandlers = BuildAppWorkspaceService.createDecorator({
    decorator: ReplaceApiLambdaFnHandlersDecorator,
    dependencies: [GetApp, LoggerService]
});

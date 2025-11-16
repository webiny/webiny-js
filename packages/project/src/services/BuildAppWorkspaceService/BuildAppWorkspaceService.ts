import { createImplementation } from "@webiny/di";
import { BuildAppWorkspaceService, GetApp, LoggerService } from "~/abstractions/index.js";

import path from "path";
import fs from "fs";
import { replaceInPath } from "replace-in-path";
import { getTemplatesFolderPath } from "~/utils/index.js";

const wait = () => new Promise(resolve => setTimeout(resolve, 10));

export class DefaultBuildAppWorkspaceService implements BuildAppWorkspaceService.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private loggerService: LoggerService.Interface
    ) {}

    async execute(params: BuildAppWorkspaceService.Params, options: BuildAppWorkspaceService.Options = {}) {
        this.loggerService.debug({ appName: params.app }, "Building app workspace baseline...");

        if (!params.env) {
            throw new Error(`Please specify environment, for example "dev".`);
        }

        const templatesFolderPath = getTemplatesFolderPath();

        const app = this.getApp.execute(params.app);
        if (app.paths.workspaceFolder.existsSync()) {
            if (options.forceRebuild !== true) {
                this.loggerService.debug(
                    { appName: params.app },
                    "App workspace already exists, skipping rebuild."
                );
                return;
            }
        }

        const appWorkspaceFolderPath = app.paths.workspaceFolder.toString();
        const baseTemplateFolderPath = path.join(templatesFolderPath, "appTemplates", "base");

        fs.mkdirSync(appWorkspaceFolderPath, { recursive: true });

        // Wait a bit and make sure the files are ready to have their content replaced.
        await wait();

        fs.cpSync(baseTemplateFolderPath, appWorkspaceFolderPath, { recursive: true });

        // Wait a bit and make sure the files are ready to have their content replaced.
        await wait();

        const { env, variant } = params;

        replaceInPath(path.join(appWorkspaceFolderPath, "/**/*.{ts,js,yaml}"), [
            { find: "{PROJECT_ID}", replaceWith: app.name },
            { find: "{PROJECT_DESCRIPTION}", replaceWith: `Webiny's ${env} app.` },
            { find: "{DEPLOY_ENV}", replaceWith: env },
            {
                find: "{DEPLOY_VARIANT}",
                replaceWith: !variant || variant === "undefined" ? "" : variant
            }
        ]);
    }
}

export const buildAppWorkspaceService = createImplementation({
    abstraction: BuildAppWorkspaceService,
    implementation: DefaultBuildAppWorkspaceService,
    dependencies: [GetApp, LoggerService]
});

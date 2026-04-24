import { createImplementation } from "@webiny/di";
import {
    BuildAppWorkspaceService,
    GetApp,
    LoggerService,
    ProjectSdkParamsService
} from "~/abstractions/index.js";

import path from "path";
import fs from "fs";
import { replaceInPath } from "replace-in-path";
import { getTemplatesFolderPath } from "~/utils/index.js";

const wait = () => new Promise(resolve => setTimeout(resolve, 10));

export class DefaultBuildAppWorkspaceService implements BuildAppWorkspaceService.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private loggerService: LoggerService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface
    ) {}

    async execute(appName: GetApp.AppName, options: BuildAppWorkspaceService.Options = {}) {
        const sdkParams = this.projectSdkParamsService.get();
        this.loggerService.debug({ appName, options }, "Building app workspace...");

        if (!sdkParams.env) {
            throw new Error(`Please specify environment, for example "dev".`);
        }

        const templatesFolderPath = getTemplatesFolderPath();

        const app = this.getApp.execute(appName);
        if (app.paths.workspaceFolder.existsSync()) {
            // Only skip rebuild if the forceRebuild option is not set to true.
            if (options.forceRebuild !== true) {
                this.loggerService.debug(
                    { appName },
                    "App workspace already exists, skipping rebuild."
                );
                return;
            }
        }

        // Clean up existing workspace folder if it exists.
        if (app.paths.workspaceFolder.existsSync()) {
            fs.rmSync(app.paths.workspaceFolder.toString(), { recursive: true, force: true });
        }

        const appWorkspaceFolderPath = app.paths.workspaceFolder.toString();
        const baseTemplateFolderPath = path.join(templatesFolderPath, "appTemplates", "base");

        fs.mkdirSync(appWorkspaceFolderPath, { recursive: true });

        // Wait a bit and make sure the files are ready to have their content replaced.
        await wait();

        fs.cpSync(baseTemplateFolderPath, appWorkspaceFolderPath, { recursive: true });

        // Wait a bit and make sure the files are ready to have their content replaced.
        await wait();

        const { env, variant } = sdkParams;

        replaceInPath(path.join(appWorkspaceFolderPath, "/**/*.{ts,js,yaml}"), [
            { find: "%{PROJECT_ID}", replaceWith: app.name },
            { find: "%{PROJECT_DESCRIPTION}", replaceWith: `Webiny's ${env} app.` },
            { find: "%{DEPLOY_ENV}", replaceWith: env },
            {
                find: "%{DEPLOY_VARIANT}",
                replaceWith: !variant || variant === "undefined" ? "" : variant
            }
        ]);

        this.loggerService.info("App workspace built successfully.");
    }
}

export const buildAppWorkspaceService = createImplementation({
    abstraction: BuildAppWorkspaceService,
    implementation: DefaultBuildAppWorkspaceService,
    dependencies: [GetApp, LoggerService, ProjectSdkParamsService]
});

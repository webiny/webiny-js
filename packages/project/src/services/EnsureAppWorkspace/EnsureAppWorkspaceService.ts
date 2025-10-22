import { createImplementation } from "@webiny/di-container";
import { EnsureAppWorkspaceService, GetApp } from "~/abstractions/index.js";

import path from "path";
import fs from "fs";
import { replaceInPath } from "replace-in-path";
import { getTemplatesFolderPath } from "~/utils/index.js";

const wait = () => new Promise(resolve => setTimeout(resolve, 10));

export class DefaultEnsureAppWorkspaceService implements EnsureAppWorkspaceService.Interface {
    constructor(private getApp: GetApp.Interface) {}

    async execute(params: EnsureAppWorkspaceService.Params) {
        // 1. Construct required paths.
        const templatesFolderPath = getTemplatesFolderPath();

        const app = this.getApp.execute(params.app);

        const appWorkspaceFolderPath = app.paths.workspaceFolder.toString();
        const baseTemplateFolderPath = path.join(templatesFolderPath, "appTemplates", "base");

        // 2. Do the cleanup first.
        if (fs.existsSync(appWorkspaceFolderPath)) {
            // fs.rmSync(appWorkspaceFolderPath, { recursive: true, force: true });
        }

        fs.mkdirSync(appWorkspaceFolderPath, { recursive: true });

        // Wait a bit and make sure the files are ready to have their content replaced.
        await wait();

        // 3. Create base.
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

export const ensureAppWorkspaceService = createImplementation({
    abstraction: EnsureAppWorkspaceService,
    implementation: DefaultEnsureAppWorkspaceService,
    dependencies: [GetApp]
});

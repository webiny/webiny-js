import fs from "fs";
import path from "path";
import { replaceInPath } from "replace-in-path";
import { createImplementation } from "@webiny/di";
import {
    BuildAppWorkspaceService,
    GetApp,
    LoggerService
} from "@webiny/project/abstractions/index.js";
import { getServerTemplatesFolderPath } from "../utils/getServerTemplatesFolderPath.js";

const wait = () => new Promise(resolve => setTimeout(resolve, 10));

export class ServerBuildAppWorkspaceService implements BuildAppWorkspaceService.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private loggerService: LoggerService.Interface
    ) {}

    async execute(appName: GetApp.AppName, options: BuildAppWorkspaceService.Options = {}) {
        if (appName === "core") {
            throw new Error(
                `The "core" app does not exist in server-flavour Webiny projects. Only "api" and "admin" are available.`
            );
        }

        this.loggerService.debug({ appName, options }, "Building server app workspace...");

        const app = this.getApp.execute(appName);

        if (app.paths.workspaceFolder.existsSync()) {
            if (options.forceRebuild !== true) {
                this.loggerService.debug(
                    { appName },
                    "Server app workspace already exists, skipping rebuild."
                );
                return;
            }
            fs.rmSync(app.paths.workspaceFolder.toString(), { recursive: true, force: true });
        }

        const templatesFolderPath = getServerTemplatesFolderPath();
        const appTemplateFolderPath = path.join(templatesFolderPath, "appTemplates", appName);

        if (!fs.existsSync(appTemplateFolderPath)) {
            throw new Error(
                `No server template found for app "${appName}" at "${appTemplateFolderPath}".`
            );
        }

        fs.mkdirSync(app.paths.workspaceFolder.toString(), { recursive: true });

        await wait();

        fs.cpSync(appTemplateFolderPath, app.paths.workspaceFolder.toString(), {
            recursive: true
        });

        await wait();

        // Replace {GLOBAL_CSS} placeholder in admin index.tsx.
        if (appName === "admin") {
            const publicFolder = path.join(process.cwd(), "public");
            const indexTsx = app.paths.workspaceFolder.join("src", "index.tsx").toString();
            const globalCssPath = path.join(publicFolder, "global.css");

            let globalCss = "";
            if (fs.existsSync(globalCssPath)) {
                const relativePath = path
                    .relative(path.dirname(indexTsx), globalCssPath)
                    .replace(/\\/g, "/");
                globalCss = `import "${relativePath}";`;
            }

            replaceInPath(indexTsx, {
                find: "{GLOBAL_CSS}",
                replaceWith: globalCss
            });
        }

        this.loggerService.info("Server app workspace built successfully.");
    }
}

export const serverBuildAppWorkspaceService = createImplementation({
    abstraction: BuildAppWorkspaceService,
    implementation: ServerBuildAppWorkspaceService,
    dependencies: [GetApp, LoggerService]
});

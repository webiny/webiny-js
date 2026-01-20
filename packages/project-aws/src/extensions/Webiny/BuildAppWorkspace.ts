import path from "path";
import fs from "fs";
import { replaceInPath } from "replace-in-path";
import {
    BuildAppWorkspaceService,
    GetApp,
    LoggerService
} from "@webiny/project/abstractions/index.js";
import { getTemplatesFolderPath } from "~/utils/index.js";

const wait = () => new Promise(resolve => setTimeout(resolve, 10));

class BuildAppWorkspaceImpl implements BuildAppWorkspaceService.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private logger: LoggerService.Interface,
        private decoratee: BuildAppWorkspaceService.Interface
    ) {}

    async execute(appName: GetApp.AppName, options: BuildAppWorkspaceService.Options = {}) {
        await this.decoratee.execute(appName, options);

        const app = this.getApp.execute(appName);

        if (app.paths.workspaceFolder.existsSync()) {
            if (options.forceRebuild !== true) {
                this.logger.debug(
                    { appName },
                    "App workspace already exists, skipping rebuild (project-aws)."
                );
                return;
            }
        }

        this.logger.info({ appName, options }, "Building app workspace (project-aws)...");

        const templatesFolderPath = getTemplatesFolderPath();
        const appWorkspaceFolderPath = app.paths.workspaceFolder.toString();
        const appTemplateFolderPath = path.join(templatesFolderPath, "appTemplates", app.name);

        // Create app.
        fs.cpSync(appTemplateFolderPath, appWorkspaceFolderPath, { recursive: true });

        // Copy `public` folder into `admin` app workspace folder.
        if (appName === "admin") {
            const publicFolder = path.join(process.cwd(), "public");
            fs.cpSync(publicFolder, path.join(appWorkspaceFolderPath, "public"), {
                recursive: true
            });

            await wait();

            const indexTsx = app.paths.workspaceFolder.join("src", "index.tsx").toString();
            const globalCssPath = path.join(publicFolder, "global.css");

            let globalCss = "";

            if (fs.existsSync(globalCssPath)) {
                const relativePath = path.relative(path.dirname(indexTsx), globalCssPath);
                globalCss = `import "${relativePath}";`;
            } else {
                console.log("globalCssPath does not exist");
            }

            replaceInPath(indexTsx, {
                find: "{GLOBAL_CSS}",
                replaceWith: globalCss
            });
        }

        this.logger.info("App workspace built successfully (project-aws).");
    }
}

const BuildAppWorkspace = BuildAppWorkspaceService.createDecorator({
    decorator: BuildAppWorkspaceImpl,
    dependencies: [GetApp, LoggerService]
});

export default BuildAppWorkspace;

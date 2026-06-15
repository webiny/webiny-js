import path from "path";
import fs from "fs";
import { replaceInPath } from "replace-in-path";
import {
    BuildAppWorkspaceService,
    GetApp,
    LoggerService,
    ProjectSdkParamsService
} from "@webiny/project/abstractions/index.js";
import { getTemplatesFolderPath, getPulumiBaseTemplatesFolderPath } from "~/utils/index.js";

const wait = () => new Promise(resolve => setTimeout(resolve, 10));

class BuildAppWorkspaceImpl implements BuildAppWorkspaceService.Interface {
    constructor(
        private getApp: GetApp.Interface,
        private logger: LoggerService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface,
        private decoratee: BuildAppWorkspaceService.Interface
    ) {}

    async execute(appName: GetApp.AppName, options: BuildAppWorkspaceService.Options = {}) {
        const sdkParams = this.projectSdkParamsService.get();

        if (!sdkParams.env) {
            throw new Error(`Please specify environment, for example "dev".`);
        }

        // Base service creates/clears the workspace directory.
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

        const appWorkspaceFolderPath = app.paths.workspaceFolder.toString();

        // Copy Pulumi scaffolding (Pulumi.yaml, pulumi/index.js).
        const pulumiBaseTemplatePath = path.join(
            getPulumiBaseTemplatesFolderPath(),
            "appTemplates",
            "base"
        );
        fs.cpSync(pulumiBaseTemplatePath, appWorkspaceFolderPath, { recursive: true });

        await wait();

        // Replace Pulumi-specific placeholders.
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

        await wait();

        // Copy app source templates (graphql/, admin src/, etc.).
        const appTemplateFolderPath = path.join(getTemplatesFolderPath(), "appTemplates", appName);
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
                const relativePath = path
                    .relative(path.dirname(indexTsx), globalCssPath)
                    .replace(/\\/g, "/");
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

export const BuildAppWorkspace = BuildAppWorkspaceService.createDecorator({
    decorator: BuildAppWorkspaceImpl,
    dependencies: [GetApp, LoggerService, ProjectSdkParamsService]
});

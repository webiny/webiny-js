import { createImplementation } from "@webiny/di";
import { GetApp, ListPackagesInAppWorkspaceService } from "~/abstractions/index.js";
import glob from "fast-glob";
import { type AppName } from "~/abstractions/types.js";
import path from "path";

export class DefaultListPackagesInAppWorkspaceService
    implements ListPackagesInAppWorkspaceService.Interface
{
    constructor(private getApp: GetApp.Interface) {}

    async execute(appName: AppName) {
        const app = this.getApp.execute(appName);

        const globResults = glob.sync("**/webiny.config.ts", {
            cwd: app.paths.workspaceFolder.toString(),
            absolute: true,
            ignore: ["**/node_modules/**", "**/dist/**"]
        });

        return globResults.map(webinyConfigFilePath => {
            const packageFolderPath = path.dirname(webinyConfigFilePath);
            return {
                name: path.basename(packageFolderPath),
                webinyConfig: {},
                paths: {
                    packageFolder: packageFolderPath,
                    webinyConfigFile: webinyConfigFilePath
                }
            };
        });
    }
}

export const listPackagesInAppWorkspaceService = createImplementation({
    abstraction: ListPackagesInAppWorkspaceService,
    implementation: DefaultListPackagesInAppWorkspaceService,
    // TODO: move getApp into a service
    dependencies: [GetApp]
});

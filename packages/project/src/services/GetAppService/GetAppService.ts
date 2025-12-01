import { createImplementation } from "@webiny/di";
import { GetAppService, GetProjectService } from "~/abstractions/index.js";
import { AppModel } from "~/models/index.js";
import { APP_NAME } from "~/utils/index.js";

export class DefaultGetAppService implements GetAppService.Interface {
    constructor(private getProjectService: GetProjectService.Interface) {}

    execute(appName: GetAppService.Params) {
        if (!appName) {
            throw new Error("App name must be provided.");
        }

        // App name must be one of the following: core, api, or admin.
        const validAppNames = Object.values(APP_NAME);
        if (!validAppNames.includes(appName)) {
            throw new Error(
                `Invalid app name "${appName}". Valid app names are: ${validAppNames.join(", ")}.`
            );
        }

        const project = this.getProjectService.execute();

        const workspaceFolderPath = project.paths.workspaceFolder.join("apps", appName).toString();

        const localPulumiStateFilesFolderPath = project.paths.localPulumiStateFilesFolder
            .join("apps", appName)
            .toString();

        return AppModel.fromDto({
            name: appName,
            paths: {
                workspaceFolder: workspaceFolderPath,
                localPulumiStateFilesFolder: localPulumiStateFilesFolderPath
            }
        });
    }
}

export const getAppService = createImplementation({
    abstraction: GetAppService,
    implementation: DefaultGetAppService,
    dependencies: [GetProjectService]
});

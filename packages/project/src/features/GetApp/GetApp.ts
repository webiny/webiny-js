import { createImplementation } from "@webiny/di";
import { GetApp, GetProject } from "~/abstractions/index.js";
import { AppModel } from "~/models/index.js";
import { APP_NAME } from "~/utils/index.js";

export class DefaultGetApp implements GetApp.Interface {
    constructor(private getProject: GetProject.Interface) {}

    execute(appName: GetApp.AppName) {
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

        const project = this.getProject.execute();

        const workspaceFolderPath = project.paths.workspacesFolder.join("apps", appName).toString();

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

export const getApp = createImplementation({
    abstraction: GetApp,
    implementation: DefaultGetApp,
    dependencies: [GetProject]
});

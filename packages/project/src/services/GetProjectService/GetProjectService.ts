import { createImplementation } from "@webiny/di";
import findUp from "find-up";
import { dirname } from "path";
import {
    GetCwdService,
    GetProjectService,
    GetProjectVersionService
} from "~/abstractions/index.js";
import { ProjectModel } from "~/models/ProjectModel.js";
import { PathModel } from "~/models/PathModel.js";
import path from "path";

export class DefaultGetProjectService implements GetProjectService.Interface {
    cachedProject: ProjectModel | null = null;

    constructor(
        private getProjectVersionService: GetProjectVersionService.Interface,
        private getCwdService: GetCwdService.Interface
    ) {}

    execute() {
        if (this.cachedProject) {
            return this.cachedProject;
        }

        const cwd = this.getCwdService.execute();
        const webinyConfigFilePathString = findUp.sync("webiny.config.tsx", { cwd });
        if (!webinyConfigFilePathString) {
            throw new Error(`Could not detect project in given directory (${cwd}).`);
        }

        const webinyConfigFilePath = PathModel.from(webinyConfigFilePathString);
        const projectRootFolderPath = PathModel.from(
            dirname(webinyConfigFilePathString.toString())
        );
        const dotWebinyFolderPath = projectRootFolderPath.join(".webiny");
        const workspaceFolderPath = projectRootFolderPath.join(".webiny", "workspace");
        const webinyConfigBaseFilePath = workspaceFolderPath.join("webiny.config.base.tsx");
        const localPulumiStateFilesFolderPath = projectRootFolderPath.join(".pulumi");
        const tsConfigFilePath = projectRootFolderPath.join("tsconfig.json");
        const projectVersion = this.getProjectVersionService.execute();

        console.log('eyeaaaaa', projectVersion)
        this.cachedProject = new ProjectModel({
            // TODO: read project name from config file.
            name: path.basename(projectRootFolderPath.toString()),
            version: projectVersion,
            paths: {
                dotWebinyFolder: dotWebinyFolderPath,
                rootFolder: projectRootFolderPath,
                webinyConfigFile: webinyConfigFilePath,
                webinyConfigBaseFile: webinyConfigBaseFilePath,
                workspaceFolder: workspaceFolderPath,
                localPulumiStateFilesFolder: localPulumiStateFilesFolderPath,
                tsConfigFile: tsConfigFilePath
            }
        });

        return this.cachedProject;
    }
}

export const getProjectService = createImplementation({
    abstraction: GetProjectService,
    implementation: DefaultGetProjectService,
    dependencies: [GetProjectVersionService, GetCwdService]
});

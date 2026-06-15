import { createImplementation } from "@webiny/di";
import {
    BuildProjectWorkspaceService,
    GetProjectService,
    LoggerService
} from "~/abstractions/index.js";
import fs from "fs";

export class DefaultBuildProjectWorkspaceService implements BuildProjectWorkspaceService.Interface {
    constructor(
        private getProjectService: GetProjectService.Interface,
        private loggerService: LoggerService.Interface
    ) {}

    async execute() {
        this.loggerService.trace("Building project workspace...");

        const project = this.getProjectService.execute();
        const workspaceFolder = project.paths.workspaceFolder.toString();

        if (!fs.existsSync(workspaceFolder)) {
            fs.mkdirSync(workspaceFolder, { recursive: true });
        }
    }
}

export const buildProjectWorkspaceService = createImplementation({
    abstraction: BuildProjectWorkspaceService,
    implementation: DefaultBuildProjectWorkspaceService,
    dependencies: [GetProjectService, LoggerService]
});

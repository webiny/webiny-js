import path from "path";
import fs from "fs";
import {
    BuildProjectWorkspaceService,
    GetProjectService,
    LoggerService
} from "@webiny/project/abstractions/index.js";
import { getServerTemplatesFolderPath } from "../utils/getServerTemplatesFolderPath.js";

/**
 * Server hosting-type counterpart to project-aws's BuildProjectWorkspace: after the base workspace is
 * built, copy the server `webiny.config.base.tsx` (which renders `<Project />`, not `<ProjectAws />`)
 * into the workspace, overwriting whatever a previous hosting type may have left behind.
 */
class BuildServerProjectWorkspaceImpl implements BuildProjectWorkspaceService.Interface {
    constructor(
        private getProjectService: GetProjectService.Interface,
        private logger: LoggerService.Interface,
        private decoratee: BuildProjectWorkspaceService.Interface
    ) {}

    async execute() {
        await this.decoratee.execute();

        this.logger.trace("Copying webiny.config.base.tsx (project-server)...");

        const templatesFolderPath = getServerTemplatesFolderPath();
        const webinyConfigBaseTemplatePath = path.join(
            templatesFolderPath,
            "webiny.config.base.tsx"
        );

        const project = this.getProjectService.execute();
        const dest = project.paths.webinyConfigBaseFile.toString();

        fs.cpSync(webinyConfigBaseTemplatePath, dest);
    }
}

export const BuildServerProjectWorkspace = BuildProjectWorkspaceService.createDecorator({
    decorator: BuildServerProjectWorkspaceImpl,
    dependencies: [GetProjectService, LoggerService]
});

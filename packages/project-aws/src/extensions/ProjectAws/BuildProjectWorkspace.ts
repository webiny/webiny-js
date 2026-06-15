import path from "path";
import fs from "fs";
import {
    BuildProjectWorkspaceService,
    GetProjectService,
    LoggerService
} from "@webiny/project/abstractions/index.js";
import { getPulumiBaseTemplatesFolderPath } from "~/utils/index.js";

class BuildProjectWorkspaceImpl implements BuildProjectWorkspaceService.Interface {
    constructor(
        private getProjectService: GetProjectService.Interface,
        private logger: LoggerService.Interface,
        private decoratee: BuildProjectWorkspaceService.Interface
    ) {}

    async execute() {
        await this.decoratee.execute();

        this.logger.trace("Copying webiny.config.base.tsx (project-aws)...");

        const templatesFolderPath = getPulumiBaseTemplatesFolderPath();
        const webinyConfigBaseTemplatePath = path.join(
            templatesFolderPath,
            "webiny.config.base.tsx"
        );

        const project = this.getProjectService.execute();
        const dest = project.paths.webinyConfigBaseFile.toString();

        fs.cpSync(webinyConfigBaseTemplatePath, dest);
    }
}

export const BuildProjectWorkspace = BuildProjectWorkspaceService.createDecorator({
    decorator: BuildProjectWorkspaceImpl,
    dependencies: [GetProjectService, LoggerService]
});

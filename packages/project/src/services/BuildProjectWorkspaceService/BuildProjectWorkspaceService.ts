import { createImplementation } from "@webiny/di";
import { BuildProjectWorkspaceService, GetProjectService } from "~/abstractions/index.js";

import path from "path";
import fs from "fs";
import { getTemplatesFolderPath } from "~/utils/index.js";

export class DefaultBuildProjectWorkspaceService implements BuildProjectWorkspaceService.Interface {
    constructor(private getProjectService: GetProjectService.Interface) {}

    async execute() {
        const templatesFolderPath = getTemplatesFolderPath();

        // 1. Copy internal webiny.config.internal.tsx
        const webinyConfigBaseTemplateFilePath = path.join(
            templatesFolderPath,
            "webiny.config.base.tsx"
        );

        const project = this.getProjectService.execute();
        const internalWebinyConfigFilePath = project.paths.workspaceFolder
            .join("webiny.config.base.tsx")
            .toString();

        fs.cpSync(webinyConfigBaseTemplateFilePath, internalWebinyConfigFilePath);
    }
}

export const buildProjectWorkspaceService = createImplementation({
    abstraction: BuildProjectWorkspaceService,
    implementation: DefaultBuildProjectWorkspaceService,
    dependencies: [GetProjectService]
});

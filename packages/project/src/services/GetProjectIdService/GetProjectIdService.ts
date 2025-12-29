import { createImplementation } from "@webiny/di";
import { GetProjectConfigService, GetProjectIdService } from "~/abstractions/index.js";
import { ProjectId as ProjectIdExt } from "~/extensions/ProjectId.js";

class DefaultGetProjectIdService implements GetProjectIdService.Interface {
    cachedProjectId: string | null = null;

    constructor(private getProjectConfigService: GetProjectConfigService.Interface) {}

    async execute() {
        if (this.cachedProjectId) {
            return this.cachedProjectId;
        }

        const envProjectId = process.env.WCP_PROJECT_ID;
        if (envProjectId) {
            this.cachedProjectId = envProjectId;
            return this.cachedProjectId;
        }

        const projectConfig = await this.getProjectConfigService.execute();
        const [projectIdExtension] = projectConfig.extensionsByType(ProjectIdExt);

        if (projectIdExtension) {
            this.cachedProjectId = projectIdExtension.params.id;
        }

        return this.cachedProjectId;
    }
}

export const getProjectIdService = createImplementation({
    abstraction: GetProjectIdService,
    implementation: DefaultGetProjectIdService,
    dependencies: [GetProjectConfigService]
});

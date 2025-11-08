import { createImplementation } from "@webiny/di";
import { GetProjectInfo, ProjectInfoService } from "~/abstractions/index.js";

export class DefaultGetProjectInfo implements GetProjectInfo.Interface {
    constructor(private projectInfoService: ProjectInfoService.Interface) {}

    async execute() {
        return this.projectInfoService.execute();
    }
}

export const getProjectInfo = createImplementation({
    abstraction: GetProjectInfo,
    implementation: DefaultGetProjectInfo,
    dependencies: [ProjectInfoService]
});

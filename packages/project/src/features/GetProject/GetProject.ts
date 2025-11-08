import { createImplementation } from "@webiny/di";
import { GetProject, GetProjectService } from "~/abstractions/index.js";

export class DefaultGetProject implements GetProject.Interface {
    constructor(private getProjectService: GetProjectService.Interface) {}

    execute() {
        return this.getProjectService.execute();
    }
}

export const getProject = createImplementation({
    abstraction: GetProject,
    implementation: DefaultGetProject,
    dependencies: [GetProjectService]
});

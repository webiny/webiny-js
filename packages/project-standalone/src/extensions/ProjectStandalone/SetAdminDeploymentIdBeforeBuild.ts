import { AdminBeforeBuild, GetProjectService } from "@webiny/project/abstractions/index.js";
import { setAdminDeploymentId } from "./SetAdminDeploymentId.js";

class SetAdminDeploymentIdBeforeBuildImpl implements AdminBeforeBuild.Interface {
    constructor(private getProjectService: GetProjectService.Interface) {}

    async execute() {
        setAdminDeploymentId(this.getProjectService);
    }
}

export const SetAdminDeploymentIdBeforeBuild = AdminBeforeBuild.createImplementation({
    implementation: SetAdminDeploymentIdBeforeBuildImpl,
    dependencies: [GetProjectService]
});

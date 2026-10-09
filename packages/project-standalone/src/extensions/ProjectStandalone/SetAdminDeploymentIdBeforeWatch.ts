import { AdminBeforeWatch, GetProjectService } from "@webiny/project/abstractions/index.js";
import { setAdminDeploymentId } from "./SetAdminDeploymentId.js";

class SetAdminDeploymentIdBeforeWatchImpl implements AdminBeforeWatch.Interface {
    constructor(private getProjectService: GetProjectService.Interface) {}

    async execute() {
        setAdminDeploymentId(this.getProjectService);
    }
}

export const SetAdminDeploymentIdBeforeWatch = AdminBeforeWatch.createImplementation({
    implementation: SetAdminDeploymentIdBeforeWatchImpl,
    dependencies: [GetProjectService]
});

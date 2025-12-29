import { AdminBeforeWatch, ProjectSdkParamsService } from "@webiny/project/abstractions/index.js";
import { SetAdminEnvVars } from "./SetAdminEnvVars.js";

class SetAdminEnvVarsBeforeWatchImpl implements AdminBeforeWatch.Interface {
    constructor(private projectSdkParamsService: ProjectSdkParamsService.Interface) {}

    async execute() {
        const setAdminEnvVars = new SetAdminEnvVars({
            projectSdkParamsService: this.projectSdkParamsService
        });

        await setAdminEnvVars.execute();
    }
}

export const SetAdminEnvVarsBeforeWatch = AdminBeforeWatch.createImplementation({
    implementation: SetAdminEnvVarsBeforeWatchImpl,
    dependencies: [ProjectSdkParamsService]
});

import { AdminBeforeBuild, ProjectSdkParamsService } from "@webiny/project/abstractions/index.js";
import { SetAdminEnvVars } from "./SetAdminEnvVars.js";

class SetAdminEnvVarsBeforeBuildImpl implements AdminBeforeBuild.Interface {
    constructor(private projectSdkParamsService: ProjectSdkParamsService.Interface) {}

    async execute() {
        const setAdminEnvVars = new SetAdminEnvVars({
            projectSdkParamsService: this.projectSdkParamsService
        });

        await setAdminEnvVars.execute();
    }
}

export const SetAdminEnvVarsBeforeBuild = AdminBeforeBuild.createImplementation({
    implementation: SetAdminEnvVarsBeforeBuildImpl,
    dependencies: [ProjectSdkParamsService]
});

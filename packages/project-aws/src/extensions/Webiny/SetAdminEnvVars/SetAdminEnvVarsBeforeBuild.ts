import { AdminBeforeBuild, ProjectSdkParamsService } from "@webiny/project/abstractions/index.js";
import { CoreStackOutputService, ApiStackOutputService } from "../../../abstractions/index.js";
import { SetAdminEnvVars } from "./SetAdminEnvVars.js";

class SetAdminEnvVarsBeforeBuildImpl implements AdminBeforeBuild.Interface {
    constructor(
        private projectSdkParamsService: ProjectSdkParamsService.Interface,
        private coreStackOutputService: CoreStackOutputService.Interface,
        private apiStackOutputService: ApiStackOutputService.Interface
    ) {}

    async execute() {
        const setAdminEnvVars = new SetAdminEnvVars({
            projectSdkParamsService: this.projectSdkParamsService,
            coreStackOutputService: this.coreStackOutputService,
            apiStackOutputService: this.apiStackOutputService
        });

        await setAdminEnvVars.execute();
    }
}

const SetAdminEnvVarsBeforeBuild = AdminBeforeBuild.createImplementation({
    implementation: SetAdminEnvVarsBeforeBuildImpl,
    dependencies: [ProjectSdkParamsService, CoreStackOutputService, ApiStackOutputService]
});

export default SetAdminEnvVarsBeforeBuild;

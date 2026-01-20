import { AdminBeforeWatch, ProjectSdkParamsService } from "@webiny/project/abstractions/index.js";
import { CoreStackOutputService, ApiStackOutputService } from "../../../abstractions/index.js";
import { SetAdminEnvVars } from "./SetAdminEnvVars.js";

class SetAdminEnvVarsBeforeWatchImpl implements AdminBeforeWatch.Interface {
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

const SetAdminEnvVarsBeforeWatch = AdminBeforeWatch.createImplementation({
    implementation: SetAdminEnvVarsBeforeWatchImpl,
    dependencies: [ProjectSdkParamsService, CoreStackOutputService, ApiStackOutputService]
});

export default SetAdminEnvVarsBeforeWatch;

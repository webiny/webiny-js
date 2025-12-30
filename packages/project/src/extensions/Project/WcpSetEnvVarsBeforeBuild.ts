import {
    BeforeBuild,
    GetProjectIdService,
    LoggerService,
    ProjectSdkParamsService,
    WcpService
} from "~/abstractions/index.js";
import { WcpSetEnvVars } from "./WcpSetEnvVars.js";

class WcpSetEnvVarsBeforeBuildImpl implements BeforeBuild.Interface {
    constructor(
        private getProjectIdService: GetProjectIdService.Interface,
        private wcpService: WcpService.Interface,
        private loggerService: LoggerService.Interface,
        private projectSdkParamsService: ProjectSdkParamsService.Interface
    ) {}

    async execute() {
        const wcpSetEnvVars = new WcpSetEnvVars({
            getProjectIdService: this.getProjectIdService,
            wcpService: this.wcpService,
            loggerService: this.loggerService,
            projectSdkParamsService: this.projectSdkParamsService
        });

        await wcpSetEnvVars.execute();
    }
}

export const WcpSetEnvVarsBeforeBuild = BeforeBuild.createImplementation({
    implementation: WcpSetEnvVarsBeforeBuildImpl,
    dependencies: [GetProjectIdService, WcpService, LoggerService, ProjectSdkParamsService]
});

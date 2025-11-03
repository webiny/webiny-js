import { createImplementation } from "@webiny/di";
import {
    BeforeBuild,
    GetProjectIdService,
    LoggerService,
    WcpService
} from "~/abstractions/index.js";
import { WcpSetEnvVars } from "./WcpSetEnvVars.js";

class WcpSetEnvVarsBeforeBuild implements BeforeBuild.Interface {
    constructor(
        private getProjectIdService: GetProjectIdService.Interface,
        private wcpService: WcpService.Interface,
        private loggerService: LoggerService.Interface
    ) {}

    async execute(params: BeforeBuild.Params) {
        const wcpSetEnvVars = new WcpSetEnvVars({
            getProjectIdService: this.getProjectIdService,
            wcpService: this.wcpService,
            loggerService: this.loggerService
        });

        await wcpSetEnvVars.execute(params);
    }
}

export default createImplementation({
    abstraction: BeforeBuild,
    implementation: WcpSetEnvVarsBeforeBuild,
    dependencies: [GetProjectIdService, WcpService, LoggerService]
});

import { createImplementation } from "@webiny/di";
import {
    BeforeWatch,
    GetProjectIdService,
    WcpService,
    LoggerService
} from "~/abstractions/index.js";
import { WcpSetEnvVars } from "./WcpSetEnvVars.js";

class WcpSetEnvVarsBeforeWatch implements BeforeWatch.Interface {
    constructor(
        private getProjectIdService: GetProjectIdService.Interface,
        private wcpService: WcpService.Interface,
        private loggerService: LoggerService.Interface
    ) {}

    async execute(params: BeforeWatch.Params) {
        if ("app" in params) {
            const wcpSetEnvVars = new WcpSetEnvVars({
                getProjectIdService: this.getProjectIdService,
                wcpService: this.wcpService,
                loggerService: this.loggerService
            });

            await wcpSetEnvVars.execute(params);
        }
    }
}

export default createImplementation({
    abstraction: BeforeWatch,
    implementation: WcpSetEnvVarsBeforeWatch,
    dependencies: [GetProjectIdService, WcpService, LoggerService]
});

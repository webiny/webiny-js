import {
    BeforeWatch,
    GetProjectIdService,
    WcpService,
    LoggerService
} from "~/abstractions/index.js";
import { WcpSetEnvVars } from "./WcpSetEnvVars.js";

class WcpSetEnvVarsBeforeWatchImpl implements BeforeWatch.Interface {
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

export const WcpSetEnvVarsBeforeWatch = BeforeWatch.createImplementation({
    implementation: WcpSetEnvVarsBeforeWatchImpl,
    dependencies: [GetProjectIdService, WcpService, LoggerService]
});

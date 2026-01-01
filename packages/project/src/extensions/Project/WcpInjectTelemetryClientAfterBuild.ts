import {
    ApiAfterBuild,
    GetApp,
    GetProjectIdService,
    LoggerService,
    UiService,
    WcpService
} from "~/abstractions/index.js";
import fs from "fs";

class WcpInjectTelemetryClientAfterBuildImpl implements ApiAfterBuild.Interface {
    constructor(
        private getProjectIdService: GetProjectIdService.Interface,
        private wcpService: WcpService.Interface,
        private loggerService: LoggerService.Interface,
        private getApp: GetApp.Interface,
        private uiService: UiService.Interface
    ) {}

    async execute() {
        const projectId = await this.getProjectIdService.execute();
        if (!projectId) {
            return;
        }

        const logger = this.loggerService;
        const ui = this.uiService;

        logger.info("Injecting WCP telemetry client into the GraphQL API handler...");

        const app = this.getApp.execute("api");

        // Only wrap the GraphQL API handler with the telemetry client.
        const handlersPaths = [app.paths.workspaceFolder.join("graphql", "build")];

        // 1. Download telemetry client code.
        const latestTelemetryClientUrl = this.wcpService
            .getWcpApiUrl()
            .join("/clients/latest.js")
            .toString();

        try {
            logger.info(`Downloading telemetry client from: ${latestTelemetryClientUrl}`);
            const response = await fetch(latestTelemetryClientUrl);
            if (!response.ok) {
                throw new Error(
                    `Failed to download telemetry client: ${response.status} - ${response.statusText}`
                );
            }

            const telemetryCodeAsString = await response.text();

            // 2. Wrap the initially built code with the telemetry client code.
            for (let i = 0; i < handlersPaths.length; i++) {
                const current = handlersPaths[i];

                // 2.1 Move initially built `handler.js` into `_handler.js`.
                const builtHandlerPath = current.join("handler.js").toString();
                const renamedHandlerPath = current.join("_handler.js").toString();
                fs.renameSync(builtHandlerPath, renamedHandlerPath);

                // 2.2 Write downloaded telemetry client code as a new `handler.js`.
                fs.writeFileSync(builtHandlerPath, telemetryCodeAsString);
            }

            logger.info("WCP telemetry client injected successfully.");
        } catch (err) {
            logger.debug({ err }, "WCP client is unavailable; telemetry was disabled.");
            ui.warning(`WCP client is unavailable; telemetry was disabled.`);
        }
    }
}

export const WcpInjectTelemetryClientAfterBuild = ApiAfterBuild.createImplementation({
    implementation: WcpInjectTelemetryClientAfterBuildImpl,
    dependencies: [GetProjectIdService, WcpService, LoggerService, GetApp, UiService]
});

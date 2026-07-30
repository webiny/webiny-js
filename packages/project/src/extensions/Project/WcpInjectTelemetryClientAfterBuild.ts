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
            .join("/clients/latest.mjs")
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

            // The downloaded wrapper re-exports only `handler`, but the AWS api bundle also exports
            // `streamHandler` — the entry point of the response-streaming Lambda. Without this
            // re-export that function has no handler to load and fails at cold start.
            //
            // Two constraints shape how it's done:
            //
            // 1. UNWRAPPED. `streamHandler` carries the marker `awslambda.streamifyResponse` attaches,
            //    and the runtime inspects the exported function for it; routing it through a telemetry
            //    wrapper function would strip the marker and silently downgrade the function to
            //    buffered responses. Re-exporting the same function object keeps the marker — at the
            //    cost of no telemetry for that function, which is the right trade.
            //
            // 2. Via a NAMESPACE import, not `export { streamHandler } from ...`. This injection also
            //    runs for the self-hosted api build, whose bundle has no `streamHandler` (streaming is
            //    native there, with no Lambda involved), and a named re-export of a missing binding is
            //    a hard ESM error that would break the whole handler. A namespace access just yields
            //    `undefined`, which nothing on that path reads.
            const wrapperCode =
                telemetryCodeAsString +
                '\nimport * as _webinyBuiltHandlers from "./_handler.mjs";\n' +
                "export const streamHandler = _webinyBuiltHandlers.streamHandler;\n";

            // 2. Wrap the initially built code with the telemetry client code.
            for (let i = 0; i < handlersPaths.length; i++) {
                const current = handlersPaths[i];

                // 2.1 Move initially built `handler.mjs` into `_handler.mjs`.
                const builtHandlerPath = current.join("handler.mjs").toString();
                const renamedHandlerPath = current.join("_handler.mjs").toString();
                fs.renameSync(builtHandlerPath, renamedHandlerPath);

                // 2.2 Write downloaded telemetry client code as a new `handler.js`.
                fs.writeFileSync(builtHandlerPath, wrapperCode);
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

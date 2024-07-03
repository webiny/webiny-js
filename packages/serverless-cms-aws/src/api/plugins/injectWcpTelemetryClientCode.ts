import * as fs from "fs";
import * as path from "path";
import fetch from "node-fetch";
import { getWcpApiUrl } from "@webiny/wcp";
import { AfterBuildPlugin } from "@webiny/cli-plugin-deploy-pulumi/plugins";

export const injectWcpTelemetryClientCode = new AfterBuildPlugin(async ({ projectApplication }, context) => {
    if (!projectApplication.project.config.id) {
        return;
    }

    const workspacePath = projectApplication.paths.workspace;
    const handlersPaths = [path.join(workspacePath, "graphql", "build")];

    // 1. Download telemetry client code.
    const latestTelemetryClientUrl = getWcpApiUrl("/clients/latest.js");
    try {
        const response = await fetch(latestTelemetryClientUrl);

        const telemetryCodeAsString = await response.text();

        // 2. Wrap the initially built code with the telemetry client code.
        for (let i = 0; i < handlersPaths.length; i++) {
            const current = handlersPaths[i];

            // 2.1 Move initially built `handler.js` into `_handler.js`.
            const builtHandlerPath = path.join(current, "handler.js");
            const renamedHandlerPath = path.join(current, "handler.preWcp.js");
            fs.renameSync(builtHandlerPath, renamedHandlerPath);

            // 2.2 Write downloaded telemetry client code as a new `handler.js`.
            fs.writeFileSync(builtHandlerPath, telemetryCodeAsString);
        }
    } catch (e) {
        context.warning(`WCP client is unavailable; telemetry was disabled.`);
    }
});

injectWcpTelemetryClientCode.name = "api.after-build.inject-wcp-telemetry-client-code";

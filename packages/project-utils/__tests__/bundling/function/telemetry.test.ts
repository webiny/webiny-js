import { downloadTelemetryFunction } from "../../../bundling/function/telemetry";
import { getTelemetryFunctionPath } from "../../../bundling/function/utils";
import * as fs from "fs";

describe("downloadTelemetryFunction()", () => {
    test("The telemetry function file has been updated", async () => {
        const now = Date.now();

        await downloadTelemetryFunction();

        const telemetryFunctionPath = fs.statSync(getTelemetryFunctionPath());

        const lastModified = new Date(telemetryFunctionPath.mtime).getTime();

        expect(lastModified).toBeGreaterThan(now);
    });
});

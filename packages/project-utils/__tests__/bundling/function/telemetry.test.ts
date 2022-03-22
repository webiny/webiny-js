import { updateTelemetryFunction } from "../../../bundling/function/telemetry";
import { getTelemetryFunctionPath } from "@webiny/cli/utils";
import * as fs from "fs";

describe("updateTelemetryFunction()", () => {
    test("The telemetry function file has been updated", async () => {
        const now = Date.now();

        await updateTelemetryFunction();

        const telemetryFunctionPath = fs.statSync(getTelemetryFunctionPath());

        const lastModified = new Date(telemetryFunctionPath.mtime).getTime();

        expect(lastModified).toBeGreaterThan(now);
    });
});

import { updateTelemetryFunction } from "../../../bundling/function/telemetry";
import { getProject } from "@webiny/cli/utils";
import * as fs from "fs";

// eslint-disable-next-line jest/no-disabled-tests
describe("updateTelemetryFunction()", () => {
    test("The telemetry function file has been updated", async () => {
        const now = Date.now();

        await updateTelemetryFunction();

        const telemetryFunctionPath = fs.statSync(
            getProject().root + "/.webiny/telemetryFunction.js"
        );

        const lastModified = new Date(telemetryFunctionPath.mtime).getTime();

        expect(lastModified).toBeGreaterThan(now);
    });
});

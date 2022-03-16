import { updateTelemetryFunction } from "../../../bundling/function/telemetry";
import * as fs from "fs";
import * as path from "path";

// eslint-disable-next-line jest/no-disabled-tests
describe.skip("updateTelemetryFunction()", () => {
    test("The telemetry function file has been updated", async () => {
        const now = Date.now();

        await updateTelemetryFunction();

        const pathToProjectUtilsRoot = path.join(__dirname, "../../../bundling/function");

        const telemetryFunctionPath = fs.statSync(pathToProjectUtilsRoot + "/telemetryFunction.js");

        const lastModified = new Date(telemetryFunctionPath.mtime).getTime();

        expect(lastModified).toBeGreaterThan(now);
    });
});

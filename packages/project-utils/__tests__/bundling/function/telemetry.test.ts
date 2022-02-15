const { updateTelemetryFunction } = require("../../../bundling/function/telemetry");
const fs = require("fs");
const path = require("path");

describe("updateTelemetryFunction()", () => {
    test("The telemetry function file has been updated", async () => {
        const now = Date.now();

        await updateTelemetryFunction();

        const pathToProjectUtilsRoot = path.join(__dirname, "../../../bundling/function");

        const telemetryFunctionPath = fs.statSync(pathToProjectUtilsRoot + "/telemetryFunction.js");

        const lastModified = new Date(telemetryFunctionPath.mtime).getTime();

        expect(lastModified).toBeGreaterThan(now);
    });
});

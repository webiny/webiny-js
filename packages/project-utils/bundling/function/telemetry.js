const fs = require("fs");
const telemetry = require("./telemetry");
const path = require("path");
const fetch = require("node-fetch");
const { getTelemetryFunctionPath } = require("@webiny/cli/utils");

const WCP_API_CLIENTS_URL = `${WCP_API_URL}/clients/latest`;

async function updateTelemetryFunction() {
    const response = await fetch(WCP_API_CLIENTS_URL);

    const telemetryCode = await response.text();

    fs.writeFileSync(getTelemetryFunctionPath(), telemetryCode);
}

async function injectHandlerTelemetry(cwd) {
    await telemetry.updateTelemetryFunction();

    fs.renameSync(path.join(cwd, "build", "handler.js"), path.join(cwd, "build", "_handler.js"));

    fs.copyFileSync(getTelemetryFunctionPath(), path.join(cwd, "build", "handler.js"));
}

module.exports = {
    updateTelemetryFunction,
    injectHandlerTelemetry
};

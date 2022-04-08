const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { getTelemetryFunctionDownloadPath } = require("./utils");

const WCP_API_CLIENTS_URL = `${process.env.WCP_API_URL}/clients/latest.js`;

async function downloadTelemetryFunction() {
    const response = await fetch(WCP_API_CLIENTS_URL);

    const telemetryCode = await response.text();

    fs.writeFileSync(getTelemetryFunctionDownloadPath(), telemetryCode);
}

async function injectHandlerTelemetry(cwd) {
    await downloadTelemetryFunction();

    fs.renameSync(path.join(cwd, "build", "handler.js"), path.join(cwd, "build", "_handler.js"));

    fs.copyFileSync(getTelemetryFunctionDownloadPath(), path.join(cwd, "build", "handler.js"));
}

module.exports = {
    downloadTelemetryFunction,
    injectHandlerTelemetry
};

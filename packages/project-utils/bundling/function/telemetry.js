const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");
const { getTelemetryFunctionPath } = require("./utils");

const WCP_API_CLIENTS_URL = `${process.env.WCP_API_URL}/clients/latest`;

async function downloadTelemetryFunction() {
    console.log(WCP_API_CLIENTS_URL);
    const response = await fetch(WCP_API_CLIENTS_URL);

    const telemetryCode = await response.text();

    fs.writeFileSync(getTelemetryFunctionPath(), telemetryCode);
}

async function injectHandlerTelemetry(cwd) {
    await downloadTelemetryFunction();

    fs.renameSync(path.join(cwd, "build", "handler.js"), path.join(cwd, "build", "_handler.js"));

    fs.copyFileSync(getTelemetryFunctionPath(), path.join(cwd, "build", "handler.js"));
}

module.exports = {
    downloadTelemetryFunction,
    injectHandlerTelemetry
};

const fs = require("fs");
const telemetry = require("./telemetry");
const path = require("path");
const fetch = require("node-fetch");
const { getProject } = require("@webiny/cli/utils");

const WCP_API_CLIENTS_URL =
    process.env.WCP_API_CLIENTS_URL || "https://d16ix00y8ek390.cloudfront.net/clients/latest";

async function updateTelemetryFunction() {
    const response = await fetch(WCP_API_CLIENTS_URL);

    const telemetryCode = await response.text();

    fs.writeFileSync(getProject().root + "/.webiny/telemetryFunction.js", telemetryCode);
}

async function injectHandlerTelemetry(cwd) {
    await telemetry.updateTelemetryFunction();

    fs.renameSync(path.join(cwd, "build", "handler.js"), path.join(cwd, "build", "_handler.js"));
    console.log(5);

    fs.copyFileSync(
        getProject().root,
        ".webiny/telemetryFunction.js",
        path.join(cwd, "build", "handler.js")
    );
}

module.exports = {
    updateTelemetryFunction,
    injectHandlerTelemetry
};

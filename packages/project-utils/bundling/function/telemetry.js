const fs = require("fs");
const fetch = require("node-fetch");

const TELEMETRY_BUCKET_URL = "https://wcp-telemetry-function-7cbe312.s3.amazonaws.com/latest";

async function updateTelemetryFunction() {
    const response = await fetch(TELEMETRY_BUCKET_URL);

    const latestCode = await response.text();

    fs.writeFileSync(__dirname + "/telemetryFunction.js", latestCode);
}

module.exports = {
    updateTelemetryFunction
};

const fs = require("fs");
const { https } = require("follow-redirects");

const TELEMETRY_BUCKET_URL = process.env.WCP_API_CLIENTS_URL || "d16ix00y8ek390.cloudfront.net";

function requestTelemetryCode() {
    const options = {
        method: "GET",
        hostname: TELEMETRY_BUCKET_URL,
        path: "/clients/latest",
        maxRedirects: 20
    };

    return new Promise((resolve, reject) => {
        https
            .request(options, function (res) {
                const chunks = [];

                res.on("data", chunk => chunks.push(chunk));

                res.on("error", error => reject(error));

                res.on("end", () => {
                    const body = Buffer.concat(chunks);
                    resolve(body.toString());
                });
            })
            .end();
    });
}

async function updateTelemetryFunction() {
    const response = await requestTelemetryCode();

    fs.writeFileSync(__dirname + "/telemetryFunction.js", response);
}

module.exports = {
    updateTelemetryFunction
};

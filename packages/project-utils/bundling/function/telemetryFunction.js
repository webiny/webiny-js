const userFunction = require("./_handler.js");
const https = require("https");
const packageData = require("../../package.json");

const TELEMETRY_ENDPOINT = "d16ix00y8ek390.cloudfront.net";

const localData = {
    apiKey: process.env.WCP_API_KEY,
    version: packageData.version,
    logs: []
};

async function postTelemetryData(telemetryData) {
    return new Promise((resolve, reject) => {
        const options = {
            method: "POST",
            hostname: TELEMETRY_ENDPOINT,
            path: "/telemetry",
            headers: { "Content-Type": "application/json" },
            maxRedirects: 20
        };

        const req = https.request(options, function (res) {
            const chunks = [];

            res.on("data", function (chunk) {
                chunks.push(chunk);
            });

            res.on("end", function () {
                const body = Buffer.concat(chunks);
                const strigifiedBody = body.toString();
                resolve(JSON.parse(strigifiedBody));
            });

            res.on("error", function (error) {
                reject(error);
            });
        });

        const postData = JSON.stringify(telemetryData);

        req.write(postData);

        req.end();
    });
}

let timerRunning = false;

const initialTime = Date.now();
const minutesToFireRequest = 5;

async function initTelemetry() {
    if (timerRunning) {
        return;
    }

    timerRunning = true;

    setInterval(async () => {
        const timeInFiveMinutes = Date.now() + minutesToFireRequest * 60000;
        if (timeInFiveMinutes > initialTime) {
            if (localData.logs.length > 0) {
                await postTelemetryData(localData);
                localData.logs = [];
            }
        }
    }, 1000);
}

async function addToTelemetryPackage(data) {
    localData.logs.push(data);

    if (localData.logs.length === 1000) {
        await postTelemetryData(localData);
        localData.logs = [];
    }
}

async function handler(args) {
    await initTelemetry();
    const start = Date.now();

    try {
        const result = await userFunction.handler(args);

        const duration = Date.now() - start;

        await addToTelemetryPackage({
            error: false,
            executionDuration: duration,
            functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
            createdOn: Date.now()
        });

        return result;
    } catch (error) {
        const duration = Date.now() - start;

        await addToTelemetryPackage({
            error: true,
            executionDuration: duration,
            functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
            createdOn: Date.now()
        });
    }
}

module.exports = {
    handler,
    localData,
    postTelemetryData
};

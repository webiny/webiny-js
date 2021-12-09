const AWS = require("aws-sdk");
const s3 = new AWS.S3();
const packageData = require("../../package.json");
const fs = require("fs");

const params = {
    Bucket: "telemetry-code",
    Delimiter: "/",
    Prefix: "telemetry-versions/"
};

async function getLatestTelemetryFunction() {
    const { Contents } = await s3.listObjects(params).promise();

    const versions = Contents.map(content => content.Key.split("/").pop()).sort();
    const latestVersion = versions.pop();

    if (packageData.telemetryVersion === latestVersion) {
        return;
    }

    const latestCodeData = await s3
        .getObject({
            Bucket: "telemetry-code",
            Key: "telemetry-versions/" + latestVersion
        })
        .promise();

    const latestCode = latestCodeData.Body.toString("utf-8");
    fs.writeFileSync(__dirname + "/telemetryFunction.js", latestCode);

    packageData.telemetryVersion = latestVersion;

    fs.writeFileSync(
        process.cwd() + "/packages/project-utils/package.json",
        JSON.stringify(packageData, null, 2)
    );
}

module.exports = {
  getLatestTelemetryFunction
}

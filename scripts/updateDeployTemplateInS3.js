const S3 = require("aws-sdk/clients/s3");
const yargs = require("yargs");
const fs = require("fs");
const path = require("path");

const args = yargs.argv;

if (!args.source) {
    console.error(`Please specify a "--source" parameter!`);
    process.exit(1);
}

(async () => {
    const s3 = new S3({ region: process.env["AWS_REGION"] ?? "us-east-1" });
    const templateKey = "cloudformation/DEPLOY_WEBINY_PROJECT_CF_TEMPLATE.yaml";

    const fileSource = path.resolve(args.source);

    console.log(`Updating key: ${templateKey}`);
    console.log(`Source file: ${fileSource}`);
    const newBody = fs.readFileSync(fileSource, "utf8");

    const bucket = "webiny-public";
    const config = { Bucket: bucket, Key: templateKey, Body: newBody, ACL: "public-read" };

    console.log(`Uploading to "${bucket}" bucket...`);
    try {
        await s3.putObject(config).promise();
        console.log(`\nSUCCESS: File was updated!`);
    } catch (err) {
        console.error(`\nERROR: ${err.message}`);
        process.exit(1);
    }
})();

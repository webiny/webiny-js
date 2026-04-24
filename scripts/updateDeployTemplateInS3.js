import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

const args = yargs(hideBin(process.argv)).version(false).argv;

if (!args.source) {
    console.error(`Please specify a "--source" parameter!`);
    process.exit(1);
}

if (!args.version) {
    console.error(`Please specify a "--version" parameter, "v5" or "v6"!`);
    process.exit(1);
}

(async () => {
    const s3 = new S3Client({
        region: process.env["AWS_REGION"] ?? "us-east-1",
        followRegionRedirects: true
    });

    const targetMap = {
        v5: "cloudformation/DEPLOY_WEBINY_PROJECT_CF_TEMPLATE.yaml",
        v6: "cloudformation/DEPLOY_WEBINY_PROJECT_CF_TEMPLATE_V6.yaml"
    };

    const key = targetMap[args.version];

    const fileSource = path.resolve(args.source);

    console.log(`Updating key: ${key}`);
    console.log(`Source file: ${fileSource}`);
    const newBody = fs.readFileSync(fileSource, "utf8");

    const bucket = "webiny-public";
    const config = { Bucket: bucket, Key: key, Body: newBody, ACL: "public-read" };

    console.log(`Uploading to "${bucket}" bucket...`);
    try {
        await s3.send(new PutObjectCommand(config));
        console.log(`\nSUCCESS: File was updated!`);
    } catch (err) {
        console.error(`\nERROR: ${err.message}`);
        process.exit(1);
    }
})();

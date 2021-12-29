const getStackOutput = require("@webiny/cli-plugin-deploy-pulumi/utils/getStackOutput");
const S3Client = require("aws-sdk/clients/s3");
const path = require("path");
const fs = require("fs");

/**
 * This plugin uploads the Admin Area React application to the deployed Amazon S3 bucket.
 * The plugin is executed right after the Admin Area React application has been successfully built
 * and relevant cloud infrastructure resources have been deployed (via `webiny deploy` command).
 * https://www.webiny.com/docs/how-to-guides/deployment/deploy-your-project/
 */
export default {
    type: "hook-after-deploy",
    name: "hook-after-deploy-admin-gateway",
    async hook(params, context) {
        if (params.projectApplication.id !== "admin-gateway") {
            return;
        }
        const start = new Date().getTime();
        const output = getStackOutput({
            folder: "apps/admin-gateway",
            env: params.env
        });

        const s3 = new S3Client({ region: process.env.AWS_REGION });

        const configFileName = `config.${params.env}.json`;
        const configFilePath = path.resolve(__dirname, `../${configFileName}`);
        if (!fs.existsSync(configFilePath)) {
            throw new Error("Cannot continue, deploy config not found.");
        }

        await s3
            .putObject({
                Bucket: output.appStorage,
                Key: "_config.json",
                ACL: "public-read",
                CacheControl: "public",
                ContentType: "application/json",
                Body: fs.readFileSync(configFilePath)
            })
            .promise();

        const duration = (new Date().getTime() - start) / 1000;

        context.success(`Deployment config uploaded in ${context.success.hl(duration)}s.`);
    }
};

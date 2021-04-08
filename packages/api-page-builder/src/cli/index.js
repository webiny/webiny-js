const LambdaClient = require("aws-sdk/clients/lambda");
const getStackOutput = require("@webiny/cli-plugin-deploy-pulumi/utils/getStackOutput");
const S3Client = require("aws-sdk/clients/s3");
const path = require("path");
const fs = require("fs");
const mime = require("mime");

module.exports = () => [
    {
        type: "hook-after-deploy",
        name: "hook-after-deploy-pb-update-settings",
        async hook(args, context) {
            if (args.stack !== "website") {
                return;
            }

            // 1. Get exports from `site` stack, for `args.env` environment.
            const websiteOutput = await getStackOutput("apps/website", args.env);

            // 2. Get exports from `api` stack, again, for `args.env` environment.
            const apiOutput = await getStackOutput("api", args.env);

            // 3. Let's update relevant Page Builder app's URLs, by invoking the `updateSettings` function,
            // which has been exported from the `api` stack for this exact purpose.
            try {
                const lambdaClient = new LambdaClient({ region: apiOutput.region });

                const response = await lambdaClient
                    .invoke({
                        FunctionName: apiOutput.updatePbSettingsFunction,
                        Payload: JSON.stringify({
                            data: {
                                websiteUrl: websiteOutput.deliveryUrl,
                                websitePreviewUrl: websiteOutput.appUrl,
                                prerendering: {
                                    app: {
                                        url: websiteOutput.appUrl
                                    },
                                    storage: {
                                        name: websiteOutput.deliveryStorage
                                    },
                                    meta: {
                                        cloudfront: {
                                            distributionId: websiteOutput.deliveryId
                                        }
                                    }
                                }
                            }
                        })
                    })
                    .promise();

                const { error } = JSON.parse(response.Payload);
                if (error) {
                    throw error;
                }

                context.success(`Default Page Builder app's settings updated.`);
            } catch (e) {
                context.error(
                    `An error occurred while trying to update default Page Builder app's settings!`
                );
                console.log(e);
            }
        }
    },
    {
        type: "hook-after-deploy",
        name: "hook-after-deploy-upload-rerender",
        async hook(args, context) {
            if (args.stack !== "website") {
                return;
            }

            context.info("Uploading Website React application to Amazon S3...");
            // 1. Get exports from `site` stack, for `args.env` environment.
            const websiteOutput = await getStackOutput("apps/website", args.env);

            // Create an Amazon S3 service client object.
            const s3 = new S3Client({ region: process.env.AWS_REGION });

            // TODO: for 5.5.0, use the new `projectApplication` object that's sent via hook args.
            // TODO: also, we will probably gonna need to move all of the plugins in this file to project application.
            let webContentsRootPath = path.join(process.cwd(), "apps", "website", "code", "build");

            if (!fs.existsSync(webContentsRootPath)) {
                webContentsRootPath = path.join(process.cwd(), "apps", "site", "code", "build");
            }

            if (!fs.existsSync(webContentsRootPath)) {
                throw new Error("Cannot continue, build folder not found.");
            }

            await crawlDirectory(webContentsRootPath, async filePath => {
                const relativeFilePath = filePath.replace(webContentsRootPath + "/", "");

                await s3
                    .putObject({
                        Bucket: websiteOutput.appStorage,
                        Key: relativeFilePath,
                        ACL: "public-read",
                        ContentType: mime.getType(filePath) || undefined,
                        Body: fs.readFileSync(filePath)
                    })
                    .promise();
                context.success(relativeFilePath);
            });

            context.success("Website application successfully uploaded.");

            context.info("Re-rendering website...");
            context.success("Website re-rendered.");
        }
    }
];

const crawlDirectory = async (dir, upload) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = `${dir}/${file}`;
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            await crawlDirectory(filePath, upload);
        }

        if (stat.isFile()) {
            await upload(filePath);
        }
    }
};

const LambdaClient = require("aws-sdk/clients/lambda");
const getStackOutput = require("@webiny/cli-plugin-deploy-pulumi/utils/getStackOutput");
const uploadFolderToS3 = require("@webiny/cli-plugin-deploy-pulumi/utils/aws/uploadFolderToS3");
const path = require("path");
const fs = require("fs");

module.exports = () => [
    {
        type: "hook-after-deploy",
        name: "hook-after-deploy-pb-update-settings",
        async hook(args, context) {
            if (args.projectApplication.id !== "website") {
                return;
            }

            // 1. Get exports from `site` stack, for `args.env` environment.
            const websiteOutput = await getStackOutput("apps/website", args.env);

            // 2. Get exports from `api` stack, again, for `args.env` environment.
            const apiOutput = await getStackOutput("api", args.env);

            // 3. Let's update relevant Page Builder app's URLs, by invoking the `updateSettings` function,
            // which has been exported from the `api` stack for this exact purpose.
            try {
                context.success(`Updating Page Builder application's prerendering settings...`);

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

                context.success(`Page Builder application's prerendering settings updated.`);
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
            if (args.projectApplication.id !== "website") {
                return;
            }

            if (args.inputs.build === false) {
                context.info(
                    `"--no-build" argument detected - skipping React application upload and prerendering.`
                );
                return;
            }

            context.info("Uploading React application...");
            // 1. Get exports from `site` stack, for `args.env` environment.
            const websiteOutput = await getStackOutput("apps/website", args.env);

            let webContentsRootPath = path.join(process.cwd(), "apps", "website", "code", "build");

            if (!fs.existsSync(webContentsRootPath)) {
                webContentsRootPath = path.join(process.cwd(), "apps", "site", "code", "build");
            }

            if (!fs.existsSync(webContentsRootPath)) {
                throw new Error("Cannot continue, build folder not found.");
            }

            const start = new Date();
            const getDuration = () => {
                return (new Date() - start) / 1000;
            };

            await uploadFolderToS3({
                path: webContentsRootPath,
                bucket: websiteOutput.appStorage,
                onFileUploadSuccess: ({ paths }) => {
                    context.success(paths.relative);
                },
                onFileUploadError: ({ paths, error }) => {
                    context.error("Failed to upload " + context.error.hl(paths.relative));
                    console.log(error);
                }
            });

            context.success(
                `React application successfully uploaded in ${context.success.hl(getDuration())}s.`
            );

            // 2. Get exports from `site` stack, for `args.env` environment.
            const apiOutput = await getStackOutput("api", args.env);

            context.info("Issuing a complete website re-render job...");

            try {
                const lambdaClient = new LambdaClient({ region: apiOutput.region });

                const response = await lambdaClient
                    .invoke({
                        FunctionName: apiOutput.psQueueAdd,
                        Payload: JSON.stringify({
                            render: {
                                path: "*",
                                configuration: {
                                    db: {
                                        namespace: "T#root"
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

                await lambdaClient
                    .invoke({
                        FunctionName: apiOutput.psQueueProcess,
                        InvocationType: "Event"
                    })
                    .promise();

                context.success("Website re-render job successfully issued.");
                context.info(
                    "Please note that it can take a couple of minutes for the website to be fully updated."
                );
            } catch (e) {
                context.error(
                    `An error occurred while trying to update default Page Builder app's settings!`
                );
                console.log(e);
            }
        }
    }
];

const LambdaClient = require("aws-sdk/clients/lambda");
const getStackOutput = require("@webiny/cli-plugin-deploy-pulumi/utils/getStackOutput");

module.exports = () => [
    {
        type: "hook-after-deploy",
        name: "hook-after-deploy-pb-update-settings",
        async hook(args, context) {
            if (args.projectApplication.name !== "website") {
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
    }
];

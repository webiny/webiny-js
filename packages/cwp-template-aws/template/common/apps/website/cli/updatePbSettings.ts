const LambdaClient = require("aws-sdk/clients/lambda");
const getStackOutput = require("@webiny/cli-plugin-deploy-pulumi/utils/getStackOutput");

/**
 * On every deployment of the Website project application, this plugin ensures
 * Webiny Page Builder application's settings are correctly updated.
 */
export default {
    type: "hook-after-deploy",
    name: "hook-after-deploy-pb-update-settings",
    async hook(args, context) {
        if (args.projectApplication.id !== "website") {
            return;
        }

        // 1. Get exports from `site` stack, for `args.env` environment.
        const websiteOutput = getStackOutput({ folder: "apps/website", env: args.env });

        // 2. Get exports from `api` stack, again, for `args.env` environment.
        const apiOutput = getStackOutput({ folder: "api", env: args.env });
        if (!apiOutput) {
            context.warning(`API was not deployed yet. Could not update page builder settings.`);
            return;
        }

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
};

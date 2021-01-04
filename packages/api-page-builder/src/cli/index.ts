const { Pulumi } = require("@webiny/pulumi-sdk");
const LambdaClient = require("aws-sdk/clients/lambda");
const path = require("path");
const { green } = require("chalk");

export default () => [
    {
        type: "hook-after-deploy",
        name: "hook-after-deploy-pb-update-settings",
        async hook(args, context) {
            if (args.stack !== "site") {
                return;
            }

            // When the "site" stack is deployed, let's make sure we update Page Builder app's settings
            // with necessary pieces of information. This way the user doesn't have to do this manually.
            const siteStackDir = path.join(context.paths.projectRoot, "apps", "site");
            const apiStackDir = path.join(context.paths.projectRoot, "api");

            const pulumi = new Pulumi();

            // 1. Get exports from `site` stack, for `args.env` environment.
            await pulumi.run({
                command: ["stack", "select", args.env],
                args: { cwd: siteStackDir }
            });

            const siteExports = await pulumi
                .run({
                    command: ["stack", "output"],
                    args: {
                        stack: args.env,
                        cwd: siteStackDir,
                        json: true
                    }
                })
                .then(({ stdout }) => JSON.parse(stdout));

            // 2. Get exports from `api` stack, again, for `args.env` environment.
            await pulumi.run({
                command: ["stack", "select", args.env],
                args: { cwd: apiStackDir }
            });

            const apiExports = await pulumi
                .run({
                    command: ["stack", "output"],
                    args: {
                        stack: args.env,
                        cwd: apiStackDir,
                        json: true
                    }
                })
                .then(({ stdout }) => JSON.parse(stdout));

            // 3. Let's update relevant Page Builder app's URLs, by invoking the `updateSettings` function,
            // which has been exported from the `api` stack for this exact purpose.
            try {
                const lambdaClient = new LambdaClient({ region: apiExports.region });

                const response = await lambdaClient
                    .invoke({
                        FunctionName: apiExports.updatePbSettingsFunction,
                        Payload: JSON.stringify({
                            data: {
                                websiteUrl: siteExports.deliveryURL,
                                websitePreviewUrl: siteExports.appURL,
                                prerendering: {
                                    app: {
                                        url: siteExports.appURL
                                    },
                                    storage: {
                                        name: siteExports.deliveryStorage
                                    },
                                    meta: {
                                        cloudfront: {
                                            distributionId: siteExports.deliveryId
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

                console.log(`${green("✔")} Default Page Builder app's settings updated.`);
            } catch (e) {
                console.log(
                    `‼️  An error occurred while trying to update default Page Builder app's settings:`
                );
                console.log(e);
            }
        }
    }
];

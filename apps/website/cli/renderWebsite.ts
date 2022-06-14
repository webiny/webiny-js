const LambdaClient = require("aws-sdk/clients/lambda");
const { getStackOutput } = require("@webiny/cli-plugin-deploy-pulumi/utils");

/**
 * On every deployment of the Website project application, this plugin ensures all pages created
 * with the Webiny Page Builder application are re-rendered.
 */
export default {
    type: "hook-after-deploy",
    name: "hook-after-deploy-website-render",
    async hook(args: any, context) {
        if (args.projectApplication.id !== "website") {
            return;
        }

        if (args.inputs.build === false) {
            context.info(`"--no-build" argument detected - skipping Website re-rendering.`);
            return;
        }

        // 2. Get exports from `web  site` stack, for `args.env` environment.
        const apiOutput = getStackOutput({ folder: "api", env: args.env });

        context.info("Issuing a complete website render job...");

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
};

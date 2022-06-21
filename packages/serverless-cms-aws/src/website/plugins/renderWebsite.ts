const LambdaClient = require("aws-sdk/clients/lambda");
import { CliContext } from "@webiny/cli/types";
const { getStackOutput } = require("@webiny/cli-plugin-deploy-pulumi/utils");

/**
 * On every deployment of the Website project application, this plugin ensures all pages created
 * with the Webiny Page Builder application are re-rendered.
 */
export default {
    type: "hook-after-deploy",
    name: "hook-after-deploy-website-render",
    async hook(params: Record<string, any>, context: CliContext) {
        const { env } = params;

        const apiOutput = getStackOutput({ folder: "apps/api", env });

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

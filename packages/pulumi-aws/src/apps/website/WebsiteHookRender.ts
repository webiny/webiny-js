import LambdaClient from "aws-sdk/clients/lambda";

import { defineAppHook } from "@webiny/pulumi-sdk";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";

export const websiteRender = defineAppHook(async (params, context) => {
    if (params.inputs.build === false) {
        context.info(`"--no-build" argument detected - skipping Website re-rendering.`);
        return;
    }

    // 2. Get exports from `site` stack, for `args.env` environment.
    const apiOutput = getStackOutput({ folder: "api", env: params.env });

    context.info("Issuing a complete website render job...");

    try {
        const lambdaClient = new LambdaClient({ region: apiOutput["region"] });

        const response = await lambdaClient
            .invoke({
                FunctionName: apiOutput["psQueueAdd"],
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

        const { error } = JSON.parse(response.Payload as string);
        if (error) {
            throw error;
        }

        await lambdaClient
            .invoke({
                FunctionName: apiOutput["psQueueProcess"],
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
});

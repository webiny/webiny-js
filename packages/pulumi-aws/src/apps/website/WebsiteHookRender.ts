import EventBridgeClient from "aws-sdk/clients/eventbridge";

import { defineAppHook } from "@webiny/pulumi-sdk";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";

export const websiteRender = defineAppHook(async (params, context) => {
    if (params.inputs.build === false) {
        context.info(`"--no-build" argument detected - skipping Website re-rendering.`);
        return;
    }

    const storageOutput = getStackOutput({ folder: "apps/storage", env: params.env });

    context.info("Issuing a complete website render job...");

    try {
        const client = new EventBridgeClient({
            region: storageOutput["region"]
        });

        const result = await client
            .putEvents({
                Entries: [
                    {
                        Source: "webiny-cli",
                        EventBusName: storageOutput["eventBusArn"],
                        DetailType: "RenderPages",
                        Detail: JSON.stringify({
                            path: "*",
                            variant: params.variant,
                            configuration: {
                                db: {
                                    namespace: "T#root"
                                }
                            }
                        })
                    }
                ]
            })
            .promise();

        const entry = result.Entries?.[0];
        if (entry?.ErrorMessage) {
            throw new Error(entry.ErrorMessage);
        }

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

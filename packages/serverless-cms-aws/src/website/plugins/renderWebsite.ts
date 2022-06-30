import EventBridgeClient from "aws-sdk/clients/eventbridge";
import { CliContext } from "@webiny/cli/types";
import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";

/**
 * On every deployment of the Website project application, this plugin ensures all pages created
 * with the Webiny Page Builder application are re-rendered.
 */
export const renderWebsite = {
    type: "hook-after-deploy",
    name: "hook-after-deploy-website-render",
    async hook(params: Record<string, any>, context: CliContext) {
        if (params.inputs.build === false) {
            context.info(`"--no-build" argument detected - skipping Website re-rendering.`);
            return;
        }

        const coreOutput = getStackOutput({ folder: "apps/core", env: params.env });

        context.info("Issuing a complete website render job...");

        try {
            const client = new EventBridgeClient({ region: coreOutput["region"] });

            const result = await client
                .putEvents({
                    Entries: [
                        {
                            Source: "webiny-cli",
                            EventBusName: coreOutput["eventBusArn"],
                            DetailType: "RenderPages",
                            Detail: JSON.stringify({
                                path: "*",
                                tenant: "root"
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
    }
};

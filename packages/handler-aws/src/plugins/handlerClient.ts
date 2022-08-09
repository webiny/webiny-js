import LambdaClient from "aws-sdk/clients/lambda";
import { HandlerClientPlugin } from "@webiny/handler-client";

export const createHandlerClientPlugin = () => {
    const plugin = new HandlerClientPlugin({
        invoke: async params => {
            const { await: useAwait, name, payload } = params;
            const lambdaClient = new LambdaClient({
                region: process.env.AWS_REGION
            });
            const response = await lambdaClient
                .invoke({
                    FunctionName: name,
                    InvocationType: useAwait === false ? "Event" : "RequestResponse",
                    Payload: JSON.stringify(payload)
                })
                .promise();

            if (useAwait === false) {
                return null;
            }

            const Payload = response.Payload as string;
            return JSON.parse(Payload);
        },
        canUse: params => {
            if (!params?.name) {
                return true;
            }
            const { name } = params;
            /**
             * In case we are invoking currently active lambda, let's use this plugin as well.
             * When invoking some other lambda, name starts with arn.
             */
            if (name === process.env.AWS_LAMBDA_FUNCTION_NAME) {
                return true;
            }
            return name.match("arn:") !== null;
        }
    });

    plugin.name = "handler-client";

    return plugin;
};

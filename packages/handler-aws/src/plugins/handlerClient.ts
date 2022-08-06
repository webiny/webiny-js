import LambdaClient from "aws-sdk/clients/lambda";
import { HandlerClientPlugin } from "@webiny/handler-client";

export const createHandlerClientPlugin = () => {
    const plugin = new HandlerClientPlugin(async params => {
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
    });

    plugin.name = "handler-client";

    return plugin;
};

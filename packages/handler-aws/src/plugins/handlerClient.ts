import LambdaClient from "aws-sdk/clients/lambda";
import { HandlerClientPlugin } from "@webiny/handler-client/types";

const plugin: HandlerClientPlugin = {
    type: "handler-client",
    name: "handler-client",
    async invoke({ name, payload, await: useAwait }) {
        const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });
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
    }
};

export default plugin;

import LambdaClient from "aws-sdk/clients/lambda";
import { HandlerClientPlugin } from "@webiny/handler-client/types";

const plugin: HandlerClientPlugin = {
    type: "handler-client",
    invoke({ name, payload, await }) {
        const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
        return Lambda.invoke({
            FunctionName: name,
            InvocationType: await ? "RequestResponse" : "Event",
            Payload: JSON.stringify(payload)
        }).promise();
    }
};

export default plugin;

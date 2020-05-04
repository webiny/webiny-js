import LambdaClient from "aws-sdk/clients/lambda";
import { Context } from "@webiny/graphql/types";

export default options => async (context: Context) => {
    if (context.user) {
        return;
    }

    const { event } = context;
    const { headers = {} } = event;
    const authorization = headers["Authorization"] || headers["authorization"] || "";

    if (!authorization) {
        return;
    }

    const token = authorization;
    const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
    const user = JSON.parse((await Lambda.invoke({
        FunctionName: options.validateAccessTokenFunction,
        Payload: JSON.stringify({ PAT: token })
    }).promise()).Payload as string);

    context.token = token;
    context.user = user;
};

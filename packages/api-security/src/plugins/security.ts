import { GraphQLContext } from "@webiny/graphql/types";
import authenticateJwt from "./authentication/authenticateJwt";
import { SecurityPlugin } from "@webiny/api-security/types";
import LambdaClient from "aws-sdk/clients/lambda";

const authenticatePat = options => async (context: GraphQLContext) => {
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

export default options => [
    {
        type: "graphql-security",
        name: "graphql-security-jwt",
        authenticate: authenticateJwt
    } as SecurityPlugin,
    {
        type: "graphql-security",
        name: "graphql-security-pat",
        authenticate: authenticatePat(options)
    } as SecurityPlugin
];

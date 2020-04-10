import { JwtToken } from "./jwtToken";
import { GraphQLContext } from "@webiny/graphql/types";
import LambdaClient from "aws-sdk/clients/lambda";

const isJwt = (token) => token.split(".").length === 3; // All JWTs are split into 3 parts by two periods

export default async (context: GraphQLContext) => {
    const { security, event } = context;
    const { headers = {} } = event;
    const authorization = headers["Authorization"] || headers["authorization"] || "";

    if (!authorization) return;

    if (isJwt(authorization)) {
        const token = authorization.replace(/[b|B]earer\s/, "");
        let user = null;
        if (token !== "" && event.httpMethod === "POST") {
            const jwt = new JwtToken({ secret: security.token.secret });
            user = (await jwt.decode(token)).data;

            // Assign token and user to context to be forwarded to ApolloServer
            context.token = token;
            context.user = user;
        }
    } else {
        const token = authorization;

        const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
        const user = JSON.parse(
            (
                await Lambda.invoke({
                    FunctionName: process.env.AUTHENTICATE_BY_PAT_FUNCTION_NAME,
                    Payload: JSON.stringify({ PAT: { token } }),
                }).promise()
            ).Payload as string
        );

        context.token = token;
        context.user = user;
    }
};

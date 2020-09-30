import LambdaClient from "aws-sdk/clients/lambda";
import { Context } from "@webiny/graphql/types";
import { SecurityIdentity } from "@webiny/api-security";
import { SecurityAuthenticationPlugin } from "@webiny/api-security/types";

type PatAuthOptions = {
    validateAccessTokenFunction?: string;
};

export default (options: PatAuthOptions = {}) => [
    {
        type: "security-authentication",
        async authenticate(context: Context) {
            const [event] = context.args;
            const { headers = {} } = event;
            const pat = headers["Authorization"] || headers["authorization"] || "";

            if (!pat) {
                return;
            }

            // If executed in the "api-security" service itself, let's directly use the
            // SecurityPersonalAccessToken model to get the necessary data (more efficient).
            const { SecurityPersonalAccessToken } = context.models;
            if (SecurityPersonalAccessToken) {
                const token = await SecurityPersonalAccessToken.findOne({
                    query: { token: pat }
                });

                if (!token) {
                    return;
                }

                const user = await token.user;
                if (!user) {
                    return;
                }

                return new SecurityIdentity({
                    id: user.id,
                    login: user.email,
                    type: "pat"
                });
            }

            try {
                const Lambda = new LambdaClient({ region: process.env.AWS_REGION });
                const response = await Lambda.invoke({
                    FunctionName: options.validateAccessTokenFunction,
                    Payload: JSON.stringify({ pat })
                }).promise();

                let userData = response.Payload as any;
                if (typeof userData === "string") {
                    userData = JSON.parse(userData);
                }

                if (!userData.id) {
                    return null;
                }

                return new SecurityIdentity({
                    ...userData,
                    login: userData.email,
                    type: "pat"
                });
            } catch {
                return null;
            }
        }
    } as SecurityAuthenticationPlugin
];

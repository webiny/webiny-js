import { JwtToken } from "./jwtToken";
import { Context } from "@webiny/graphql/types";

const isJwt = token => token.split(".").length === 3; // All JWTs are split into 3 parts by two periods

export default async (context: Context) => {
    const { security, event } = context;
    const { headers = {} } = event;
    const authorization = headers["Authorization"] || headers["authorization"] || "";

    if (!authorization) {
        return;
    }

    if (isJwt(authorization)) {
        const token = authorization.replace(/bearer\s/i, "");
        let user = null;
        if (token !== "" && event.httpMethod === "POST") {
            try {
            const jwt = new JwtToken({ secret: security.options.token.secret });
            user = (await jwt.decode(token)).data;
            } catch (e) {
                const a = 123;
            }
            // Assign token and user to context to be forwarded to ApolloServer
            context.security.token = token;
            context.security.user = user;
        }
    }
};
